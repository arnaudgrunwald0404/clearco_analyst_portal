#!/usr/bin/env node

/**
 * Test script for AI-powered publication discovery
 * This script tests the discovery process step by step to identify issues
 */

const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')

// Check environment variables
console.log('🔍 Environment Check:')
console.log(`✓ OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'Set' : '❌ Missing'}`)
console.log(`✓ GOOGLE_SEARCH_API_KEY: ${process.env.GOOGLE_SEARCH_API_KEY ? 'Set' : '❌ Missing'}`)
console.log(`✓ GOOGLE_SEARCH_ENGINE_ID: ${process.env.GOOGLE_SEARCH_ENGINE_ID ? 'Set' : '❌ Missing'}`)
console.log(`✓ SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : '❌ Missing'}`)
console.log(`✓ SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : '❌ Missing'}`)

async function testOpenAI() {
  try {
    console.log('\n🤖 Testing OpenAI connection...')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "Test connection. Respond with just 'OK'." }],
      max_tokens: 5
    })
    
    console.log(`✅ OpenAI Response: ${response.choices[0]?.message?.content}`)
    return true
  } catch (error) {
    console.log(`❌ OpenAI Error: ${error.message}`)
    return false
  }
}

async function testGoogleSearch() {
  try {
    console.log('\n🔍 Testing Google Search API...')
    
    if (!process.env.GOOGLE_SEARCH_API_KEY || !process.env.GOOGLE_SEARCH_ENGINE_ID) {
      console.log('❌ Google Search API credentials missing')
      return false
    }
    
    const query = '"Josh Bersin" research report 2024'
    const url = `https://customsearch.googleapis.com/customsearch/v1?` +
      `key=${process.env.GOOGLE_SEARCH_API_KEY}&` +
      `cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&` +
      `q=${encodeURIComponent(query)}&` +
      `num=3&` +
      `fields=items(title,link,snippet)`

    console.log(`🔎 Search Query: ${query}`)
    
    const response = await fetch(url)
    console.log(`📡 HTTP Status: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log(`❌ Google Search Error: ${errorText}`)
      return false
    }

    const data = await response.json()
    console.log(`📊 Results Found: ${data.items?.length || 0}`)
    
    if (data.items && data.items.length > 0) {
      console.log(`✅ Sample Result: ${data.items[0].title}`)
      console.log(`   URL: ${data.items[0].link}`)
      return true
    } else {
      console.log('⚠️ No search results returned')
      return false
    }
    
  } catch (error) {
    console.log(`❌ Google Search Error: ${error.message}`)
    return false
  }
}

async function testSupabase() {
  try {
    console.log('\n🗄️ Testing Supabase connection...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    const { data, error } = await supabase
      .from('analysts')
      .select('id, firstName, lastName, personalWebsite')
      .eq('id', 'cladd367a2')
      .single()
    
    if (error) {
      console.log(`❌ Supabase Error: ${error.message}`)
      return false
    }
    
    console.log(`✅ Found analyst: ${data.firstName} ${data.lastName}`)
    console.log(`   Website: ${data.personalWebsite || 'None'}`)
    return true
    
  } catch (error) {
    console.log(`❌ Supabase Error: ${error.message}`)
    return false
  }
}

async function generateTestQueries() {
  try {
    console.log('\n📝 Testing AI query generation...')
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    
    const analyst = {
      firstName: 'Josh',
      lastName: 'Bersin',
      company: 'Bersin & Associates',
      email: 'josh@bersinpartners.com',
      personalWebsite: 'https://joshbersin.com/'
    }
    
    const prompt = `Generate 3 Google search queries to find recent publications by this industry analyst:

Name: ${analyst.firstName} ${analyst.lastName}
Company: ${analyst.company}
Email Domain: ${analyst.email.split('@')[1]}
Personal Website: ${analyst.personalWebsite}

Focus on finding their written content from 2024-2025. Format as JSON array:
["query1", "query2", "query3"]`

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 300
    })

    const content = response.choices[0]?.message?.content?.trim()
    console.log(`🤖 AI Response: ${content}`)
    
    const queries = JSON.parse(content)
    console.log(`✅ Generated ${queries.length} queries:`)
    queries.forEach((query, idx) => {
      console.log(`   ${idx + 1}. ${query}`)
    })
    
    return queries
    
  } catch (error) {
    console.log(`❌ Query Generation Error: ${error.message}`)
    return []
  }
}

async function main() {
  console.log('🚀 AI Publication Discovery Test\n')
  
  // Test each component
  const openaiOk = await testOpenAI()
  const googleOk = await testGoogleSearch()
  const supabaseOk = await testSupabase()
  
  if (openaiOk && supabaseOk) {
    await generateTestQueries()
  }
  
  console.log('\n📊 Test Summary:')
  console.log(`   OpenAI: ${openaiOk ? '✅' : '❌'}`)
  console.log(`   Google Search: ${googleOk ? '✅' : '❌'}`)
  console.log(`   Supabase: ${supabaseOk ? '✅' : '❌'}`)
  
  if (!googleOk) {
    console.log('\n💡 To fix Google Search issues:')
    console.log('   1. Verify GOOGLE_SEARCH_ENGINE_ID is correct')
    console.log('   2. Check that Custom Search Engine is properly configured')
    console.log('   3. Ensure API quotas are not exceeded')
    console.log('   4. Verify billing is enabled for the Google Cloud project')
  }
}

main().catch(console.error)