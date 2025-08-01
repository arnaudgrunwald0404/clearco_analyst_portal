import fs from 'fs/promises'
import path from 'path'

// You may need to install openai: npm install openai
import { OpenAI } from 'openai'

const DATA_MODEL_PATH = path.join(process.cwd(), 'DATA_MODEL.md')
const PRISMA_SCHEMA_PATH = path.join(process.cwd(), 'prisma', 'schema.prisma')

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function extractAnalystFieldNames(schema: string): string[] {
  const analystBlock = schema.match(/model Analyst \{([\s\S]*?)\n\}/)
  if (!analystBlock) return []
  return analystBlock[1]
    .split('\n')
    .map(line => line.trim().split(' ')[0])
    .filter(f => f && !f.startsWith('//'))
    .filter(f => !['@@map', '@@unique', '@@index', '@@id', '@@default', '@@relation', '@@updatedAt', '@@createdAt'].some(meta => f.startsWith(meta)))
}

function extractAllModelFieldNames(schema: string): Record<string, string[]> {
  const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g
  const models: Record<string, string[]> = {}
  let match
  while ((match = modelRegex.exec(schema))) {
    const modelName = match[1]
    const fields = match[2]
      .split('\n')
      .map(line => line.trim().split(' ')[0])
      .filter(f => f && !f.startsWith('//'))
      .filter(f => !['@@map', '@@unique', '@@index', '@@id', '@@default', '@@relation', '@@updatedAt', '@@createdAt'].some(meta => f.startsWith(meta)))
    models[modelName] = fields
  }
  return models
}

function postProcessSQL(sql: string, validFields: string[], allModelFields?: Record<string, string[]>): string {
  let fixed = sql
  // Replace common field name errors for Analyst
  if (!validFields.includes('firstname') && validFields.includes('firstName')) {
    fixed = fixed.replace(/\.[ ]*firstname\b/gi, '.firstName')
  }
  if (!validFields.includes('lastname') && validFields.includes('lastName')) {
    fixed = fixed.replace(/\.[ ]*lastname\b/gi, '.lastName')
  }
  if (!validFields.includes('analystid') && validFields.includes('analystId')) {
    fixed = fixed.replace(/\.[ ]*analystid\b/gi, '.analystId')
  }
  if (!validFields.includes('briefingid') && validFields.includes('briefingId')) {
    fixed = fixed.replace(/\.[ ]*briefingid\b/gi, '.briefingId')
  }
  // For all models, fix .fieldname to correct camelCase
  if (allModelFields) {
    for (const [model, fields] of Object.entries(allModelFields)) {
      for (const field of fields) {
        const lower = field.toLowerCase()
        if (lower !== field) {
          // Replace .model.field (wrong case) with .model.CorrectCase
          const regex = new RegExp(`(${model}|"${model}")\.[ ]*${lower}\b`, 'gi')
          fixed = fixed.replace(regex, `$1.${field}`)
        }
      }
    }
  }
  // Fix table name casing and quoting
  fixed = fixed.replace(/from\s+analyst\b/gi, 'from "Analyst"')
  fixed = fixed.replace(/join\s+analyst\b/gi, 'join "Analyst"')
  fixed = fixed.replace(/from\s+'analyst'\b/gi, 'from "Analyst"')
  fixed = fixed.replace(/join\s+'analyst'\b/gi, 'join "Analyst"')
  fixed = fixed.replace(/from\s+"analyst"\b/gi, 'from "Analyst"')
  fixed = fixed.replace(/join\s+"analyst"\b/gi, 'join "Analyst"')
  return fixed
}

/**
 * Generate a SQL query for analysts from a natural language description.
 * @param audienceDescription Natural language filter (e.g. "All Tier 1 analysts at Gartner who are active")
 * @param errorMessage Optional error message from a failed SQL attempt
 * @param previousSQL Optional previous SQL that failed
 * @returns SQL query string
 */
export async function generateAnalystSQLFromNL(audienceDescription: string, errorMessage?: string, previousSQL?: string, extraInstruction?: string): Promise<string> {
  const schema = await fs.readFile(DATA_MODEL_PATH, 'utf8')

  let prepend = ''
  if (extraInstruction && extraInstruction.startsWith('FIELD_LIST:')) {
    const fieldList = extraInstruction.replace('FIELD_LIST:', '').trim()
    prepend = `# VALID ANALYST FIELDS\n${fieldList}\nIf you use any field not in this list, your answer is wrong. Use exact capitalization.\n\n`
    extraInstruction = ''
  }

  let prompt = `${prepend}You are an expert Postgres SQL generator. Given a data model and a natural language description, output a valid SQL query that returns the correct set of analysts. Only output the SQL query, nothing else.\n\n# Data Model\n${schema}\n\n# Instruction\nGenerate a SQL query for the following audience description:\n"""\n${audienceDescription}\n"""\n\n# Requirements\n- Only output a valid Postgres SQL query (no explanation, no markdown).\n- The query should select from the Analyst table and join other tables if needed.\n- Return all relevant fields for each analyst (id, firstName, lastName, email, company, title, influence, status, etc.).\n- Always quote string and enum values (e.g., WHERE influence = 'VERY_HIGH').\n- Use correct field names and enum values from the schema, including exact capitalization.\n- Always use the exact table name \"Analyst\" (with double quotes) in all FROM and JOIN clauses.\n- If the description is ambiguous, make a reasonable assumption.\n- Do not use fields or tables not present in the schema.\n- Do not use markdown formatting.\n- The query must be valid Postgres SQL.\n- If you output anything other than a valid SELECT SQL query, your answer is wrong.\n`

  if (extraInstruction) {
    prompt += `\n# Additional Instruction\n${extraInstruction}`
  }

  if (errorMessage && previousSQL) {
    prompt += `\n# Previous Attempt\nThe following SQL failed with this error:\nSQL: ${previousSQL}\nError: ${errorMessage}\nPlease fix the SQL and output only the corrected query.`
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are a helpful assistant that only outputs SQL queries.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 512,
    temperature: 0.1,
  })

  const sql = completion.choices[0]?.message?.content?.trim() || ''
  return sql
}

/**
 * Try generating and running the SQL, and if it fails, retry with the error message.
 */
export async function generateAnalystSQLWithRetry(audienceDescription: string, runQuery: (sql: string) => Promise<any>): Promise<{ data: any, sql: string, error?: string }> {
  // Extract valid field names from the Prisma schema
  const prismaSchema = await fs.readFile(PRISMA_SCHEMA_PATH, 'utf8')
  const analystFields = extractAnalystFieldNames(prismaSchema)
  const allModelFields = extractAllModelFieldNames(prismaSchema)

  let sql = await generateAnalystSQLFromNL(audienceDescription)
  sql = postProcessSQL(sql, analystFields, allModelFields)

  // If not a SELECT, retry with forceful instruction
  if (!sql.trim().toLowerCase().startsWith('select')) {
    const extraInstruction = 'You did not output a valid SELECT SQL query. Only output a valid SELECT SQL query, nothing else.'
    sql = await generateAnalystSQLFromNL(audienceDescription, undefined, undefined, extraInstruction)
    sql = postProcessSQL(sql, analystFields, allModelFields)
  }

  try {
    const data = await runQuery(sql)
    return { data, sql }
  } catch (err: any) {
    const errorMessage = err.message || String(err)
    let extraInstruction = ''
    // Check for missing column error
    const match = errorMessage.match(/column ["']?([a-zA-Z0-9_.]+)["']? does not exist/i)
    if (match) {
      const missingColumn = match[1]
      extraInstruction = `FIELD_LIST: ${analystFields.join(', ')}\nThe previous SQL failed because the column \"${missingColumn}\" does not exist. Use only these, with exact capitalization. Do not use \"${missingColumn}\".`
    }
    let fixedSQL = await generateAnalystSQLFromNL(audienceDescription, errorMessage, sql, extraInstruction)
    fixedSQL = postProcessSQL(fixedSQL, analystFields, allModelFields)
    // If not a SELECT, retry with forceful instruction
    if (!fixedSQL.trim().toLowerCase().startsWith('select')) {
      const forceful = 'You did not output a valid SELECT SQL query. Only output a valid SELECT SQL query, nothing else.'
      fixedSQL = await generateAnalystSQLFromNL(audienceDescription, errorMessage, sql, forceful)
      fixedSQL = postProcessSQL(fixedSQL, analystFields, allModelFields)
    }
    try {
      const data = await runQuery(fixedSQL)
      return { data, sql: fixedSQL }
    } catch (err2: any) {
      return { data: null, sql: fixedSQL, error: err2.message || String(err2) }
    }
  }
} 