import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface SchedulingContext {
  analyst: {
    firstName: string
    lastName: string
    company: string
    email: string
    influence: string
  }
  conversationHistory: Array<{
    direction: 'OUTBOUND' | 'INBOUND'
    content: string
    sentAt: Date
  }>
  suggestedTimes: string[]
  subject: string
}

export interface EmailResponse {
  shouldSend: boolean
  content: string
  subject: string
  agreedTime?: Date
  needsFollowUp: boolean
  followUpDelay?: number // hours
}

export class SchedulingAIService {
  private systemPrompt = `You are a professional scheduling assistant for ClearCompany, a leading HR technology company. Your role is to schedule briefings with industry analysts.

Key responsibilities:
1. Be polite, professional, and efficient
2. Extract scheduling preferences from analyst responses
3. Suggest appropriate meeting times based on availability
4. Confirm meeting details and create calendar events
5. Handle objections gracefully and offer alternatives

Guidelines:
- Always maintain a professional tone
- Be concise but friendly
- Offer 2-3 time slots when suggesting times
- Confirm time zone (default: Eastern Time)
- Include Zoom meeting details
- Ask for any specific topics they'd like to discuss

Meeting duration: 30-60 minutes
Time zones: Eastern Time (ET)
Platform: Zoom`

  async generateInitialEmail(context: SchedulingContext): Promise<string> {
    const prompt = `${this.systemPrompt}

Generate an initial scheduling email for ${context.analyst.firstName} ${context.analyst.lastName} from ${context.analyst.company}.

Subject: ${context.subject}

Suggested times: ${context.suggestedTimes.join(', ')}

Please write a professional, friendly email that:
1. Introduces the purpose of the briefing
2. Mentions their expertise and company
3. Offers the suggested times
4. Asks for their preference or alternative times
5. Mentions it will be a Zoom meeting

Keep it under 200 words.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    })

    return response.choices[0]?.message?.content || ''
  }

  async analyzeResponse(
    emailContent: string,
    context: SchedulingContext
  ): Promise<EmailResponse> {
    const prompt = `${this.systemPrompt}

Analyze this email response from ${context.analyst.firstName} ${context.analyst.lastName}:

Email content:
${emailContent}

Conversation history:
${context.conversationHistory.map(h => `${h.direction}: ${h.content}`).join('\n')}

Determine:
1. Do they agree to a time? If yes, extract the agreed time
2. Do they suggest alternative times?
3. Do they decline or need more information?
4. Should we send a follow-up email?
5. What should our next response be?

Respond in JSON format:
{
  "shouldSend": boolean,
  "content": "email content to send",
  "subject": "email subject",
  "agreedTime": "ISO date string if agreed",
  "needsFollowUp": boolean,
  "followUpDelay": number (hours)
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(response.choices[0]?.message?.content || '{}')
    
    return {
      shouldSend: result.shouldSend || false,
      content: result.content || '',
      subject: result.subject || '',
      agreedTime: result.agreedTime ? new Date(result.agreedTime) : undefined,
      needsFollowUp: result.needsFollowUp || false,
      followUpDelay: result.followUpDelay
    }
  }

  async generateFollowUpEmail(context: SchedulingContext): Promise<string> {
    const prompt = `${this.systemPrompt}

Generate a follow-up email for ${context.analyst.firstName} ${context.analyst.lastName} since we haven't heard back.

Subject: ${context.subject}

Previous suggested times: ${context.suggestedTimes.join(', ')}

Write a polite follow-up that:
1. Reminds them of the briefing opportunity
2. Offers to reschedule if the times don't work
3. Suggests new time slots
4. Keeps the door open for future scheduling

Keep it under 150 words.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 400
    })

    return response.choices[0]?.message?.content || ''
  }

  async generateConfirmationEmail(
    agreedTime: Date,
    context: SchedulingContext
  ): Promise<string> {
    const prompt = `${this.systemPrompt}

Generate a confirmation email for ${context.analyst.firstName} ${context.analyst.lastName} confirming the briefing.

Agreed time: ${agreedTime.toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })} ET

Subject: ${context.subject}

Write a confirmation email that:
1. Confirms the meeting time and date
2. Mentions it will be a Zoom meeting
3. Asks if they have any specific topics to discuss
4. Provides contact information for questions
5. Thanks them for their time

Keep it under 200 words.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    })

    return response.choices[0]?.message?.content || ''
  }
}

export const schedulingAI = new SchedulingAIService()
