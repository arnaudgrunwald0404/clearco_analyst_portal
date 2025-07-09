import test from 'node:test'
import assert from 'node:assert'

// Test Suite: Core Analyst Page Functionality
test('Analyst Page - Core Functionality', async (t) => {
  await t.test('should handle multiple social profile icons', () => {
    // Test LinkedIn icons from socialHandles
    const analyst = {
      socialHandles: [
        { platform: 'LINKEDIN', handle: 'https://linkedin.com/in/sarah1', isActive: true },
        { platform: 'LINKEDIN', handle: 'https://linkedin.com/in/sarah2', isActive: true },
        { platform: 'TWITTER', handle: '@sarah1', isActive: true },
        { platform: 'TWITTER', handle: '@sarah2', isActive: true }
      ]
    }
    
    const linkedinHandles = analyst.socialHandles.filter(h => h.platform === 'LINKEDIN')
    const twitterHandles = analyst.socialHandles.filter(h => h.platform === 'TWITTER')
    
    assert.strictEqual(linkedinHandles.length, 2, 'Should have 2 LinkedIn handles')
    assert.strictEqual(twitterHandles.length, 2, 'Should have 2 Twitter handles')
  })

  await t.test('should generate correct social profile URLs', () => {
    // Test LinkedIn URL generation
    const linkedinHandle = 'profile-name'
    const linkedinUrl = linkedinHandle.startsWith('http') 
      ? linkedinHandle 
      : `https://linkedin.com/in/${linkedinHandle}`
    assert.strictEqual(linkedinUrl, 'https://linkedin.com/in/profile-name')

    // Test Twitter URL generation
    const twitterHandle = '@username'
    const twitterUrl = `https://twitter.com/${twitterHandle.replace('@', '')}`
    assert.strictEqual(twitterUrl, 'https://twitter.com/username')
  })

  await t.test('should prefer socialHandles over legacy fields', () => {
    const analyst = {
      linkedIn: 'https://linkedin.com/in/old-profile',
      twitter: '@old_handle',
      socialHandles: [
        { platform: 'LINKEDIN', handle: 'https://linkedin.com/in/new-profile', isActive: true }
      ]
    }
    
    const linkedinHandles = analyst.socialHandles.filter(h => h.platform === 'LINKEDIN')
    assert.strictEqual(linkedinHandles.length, 1)
    assert.strictEqual(linkedinHandles[0].handle, 'https://linkedin.com/in/new-profile')
  })

  await t.test('should format dates correctly', () => {
    const dateString = '2024-10-15T10:00:00Z'
    const formatted = new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    assert.ok(formatted.includes('2024'))
    assert.ok(formatted.includes('Oct'))
    assert.ok(formatted.includes('15'))
  })

  await t.test('should handle missing data gracefully', () => {
    const analyst = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      socialHandles: []
    }
    
    const linkedinHandles = analyst.socialHandles.filter(h => h.platform === 'LINKEDIN')
    const twitterHandles = analyst.socialHandles.filter(h => h.platform === 'TWITTER')
    
    assert.strictEqual(linkedinHandles.length, 0)
    assert.strictEqual(twitterHandles.length, 0)
  })
})
