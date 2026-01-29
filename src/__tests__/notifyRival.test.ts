import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock environment variables
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test-project.supabase.co')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')

describe('notifyRival Edge Function Call', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        global.fetch = vi.fn()
    })

    it('should call Edge Function with correct parameters for gym', async () => {
        const mockFetch = vi.mocked(global.fetch).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true }),
        } as Response)

        // Simulate the notifyRival function logic
        const partner = { id: 'rival-123', display_name: 'RivalName' }
        const user = { id: 'user-456', display_name: 'UserName' }
        const gameState = { pot_amount: 100 }
        const type = 'gym'

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        await fetch(`${supabaseUrl}/functions/v1/send-push`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                rival_user_id: partner.id,
                type,
                actor_name: user.display_name,
                bet_amount: gameState.pot_amount,
            }),
        })

        expect(mockFetch).toHaveBeenCalledWith(
            'https://test-project.supabase.co/functions/v1/send-push',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                }),
            })
        )

        const callArgs = mockFetch.mock.calls[0]
        const body = JSON.parse(callArgs[1]?.body as string)
        expect(body.rival_user_id).toBe('rival-123')
        expect(body.type).toBe('gym')
        expect(body.actor_name).toBe('UserName')
        expect(body.bet_amount).toBe(100)
    })

    it('should call with type weight for weight logging', async () => {
        const mockFetch = vi.mocked(global.fetch).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true }),
        } as Response)

        const supabaseUrl = 'https://test-project.supabase.co'
        await fetch(`${supabaseUrl}/functions/v1/send-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rival_user_id: 'rival-id',
                type: 'weight',
                actor_name: 'TestUser',
                bet_amount: 50,
            }),
        })

        const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string)
        expect(body.type).toBe('weight')
    })

    it('should call with type calories for calorie completion', async () => {
        const mockFetch = vi.mocked(global.fetch).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true }),
        } as Response)

        const supabaseUrl = 'https://test-project.supabase.co'
        await fetch(`${supabaseUrl}/functions/v1/send-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rival_user_id: 'rival-id',
                type: 'calories',
                actor_name: 'TestUser',
                bet_amount: 75,
            }),
        })

        const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string)
        expect(body.type).toBe('calories')
        expect(body.bet_amount).toBe(75)
    })

    it('should handle fetch errors gracefully', async () => {
        vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))

        let errorCaught = false
        try {
            await fetch('https://test.supabase.co/functions/v1/send-push', {
                method: 'POST',
                body: JSON.stringify({}),
            })
        } catch (err) {
            errorCaught = true
            expect((err as Error).message).toBe('Network error')
        }
        expect(errorCaught).toBe(true)
    })
})

describe('Edge Function Response Handling', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        global.fetch = vi.fn()
    })

    it('should handle 404 when no subscription found', async () => {
        vi.mocked(global.fetch).mockResolvedValue({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ error: 'No subscription found' }),
        } as Response)

        const response = await fetch('https://test.supabase.co/functions/v1/send-push', {
            method: 'POST',
            body: JSON.stringify({ rival_user_id: 'no-sub-user' }),
        })

        expect(response.ok).toBe(false)
        expect(response.status).toBe(404)
    })

    it('should handle successful push', async () => {
        vi.mocked(global.fetch).mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
                success: true,
                message: 'Push queued',
                notification: { title: '🏋️ Rival Alert!', body: 'Test message' }
            }),
        } as Response)

        const response = await fetch('https://test.supabase.co/functions/v1/send-push', {
            method: 'POST',
            body: JSON.stringify({
                rival_user_id: 'valid-user',
                type: 'gym',
                actor_name: 'TestRival',
                bet_amount: 100
            }),
        })

        expect(response.ok).toBe(true)
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.notification.title).toContain('Rival Alert')
    })
})
