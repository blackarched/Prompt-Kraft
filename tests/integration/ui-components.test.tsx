import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PromptCraftUI from '../../src/PromptCraftUI'

// Integration tests that test the UI with real utility functions
// (not mocked like unit tests)

describe('UI Components Integration', () => {
  it('should integrate with real enhancement logic', async () => {
    const user = userEvent.setup()
    render(<PromptCraftUI />)
    
    // Test with a code prompt
    const codePrompt = 'write a python function to reverse a string'
    const textarea = screen.getByLabelText('Your Prompt:')
    await user.type(textarea, codePrompt)
    
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    await user.click(enhanceButton)
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Prompt')).toBeInTheDocument()
    }, { timeout: 5000 })
    
    // Should detect code template
    expect(screen.getByText(/Code Generation/)).toBeInTheDocument()
    
    // Enhanced prompt should contain original input and template content
    const enhancedText = screen.getByText(new RegExp(codePrompt, 'i'))
    expect(enhancedText).toBeInTheDocument()
    
    // Should contain template-specific content
    const enhancedPrompt = screen.getByRole('region', { name: /enhanced prompt/i }) || 
                          screen.getByText(/senior software engineer/i)
    expect(enhancedPrompt).toBeInTheDocument()
  })

  it('should handle different template detection in UI', async () => {
    const user = userEvent.setup()
    
    const testCases = [
      {
        prompt: 'create a poem about nature',
        expectedTemplate: /Creative Writing/i,
        expectedContent: /creative writer/i
      },
      {
        prompt: 'explain how photosynthesis works',
        expectedTemplate: /Detailed Explanation/i,
        expectedContent: /master educator/i
      },
      {
        prompt: 'help me plan my day',
        expectedTemplate: /General Expert/i,
        expectedContent: /world-class expert/i
      }
    ]
    
    for (const testCase of testCases) {
      render(<PromptCraftUI />)
      
      const textarea = screen.getByLabelText('Your Prompt:')
      await user.clear(textarea)
      await user.type(textarea, testCase.prompt)
      
      const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
      await user.click(enhanceButton)
      
      await waitFor(() => {
        expect(screen.getByText('Enhanced Prompt')).toBeInTheDocument()
      })
      
      expect(screen.getByText(testCase.expectedTemplate)).toBeInTheDocument()
      expect(screen.getByText(testCase.expectedContent)).toBeInTheDocument()
      
      // Clean up for next iteration
      render(<div />)
    }
  })

  it('should handle model selection with real model instructions', async () => {
    const user = userEvent.setup()
    render(<PromptCraftUI />)
    
    const testPrompt = 'explain artificial intelligence'
    const textarea = screen.getByLabelText('Your Prompt:')
    await user.type(textarea, testPrompt)
    
    // Test different models
    const modelSelect = screen.getByLabelText('Target Model:')
    
    // Test GPT-4
    await user.selectOptions(modelSelect, 'gpt4')
    
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    await user.click(enhanceButton)
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Prompt')).toBeInTheDocument()
    })
    
    expect(screen.getByText('GPT4')).toBeInTheDocument() // Model badge
    
    // Enhanced prompt should contain GPT-4 specific instructions
    const enhancedContent = screen.getByText(/GPT-4.*advanced reasoning/i) ||
                           screen.getByText(/advanced reasoning/i)
    expect(enhancedContent).toBeInTheDocument()
  })

  it('should maintain UI state consistency during interactions', async () => {
    const user = userEvent.setup()
    render(<PromptCraftUI />)
    
    const testPrompt = 'test state consistency'
    const textarea = screen.getByLabelText('Your Prompt:')
    const modelSelect = screen.getByLabelText('Target Model:')
    
    // Set initial state
    await user.type(textarea, testPrompt)
    await user.selectOptions(modelSelect, 'claude')
    
    // Enhance
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    await user.click(enhanceButton)
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Prompt')).toBeInTheDocument()
    })
    
    // State should be preserved
    expect((textarea as HTMLTextAreaElement).value).toBe(testPrompt)
    expect((modelSelect as HTMLSelectElement).value).toBe('claude')
    
    // Should be able to enhance again with same settings
    await user.click(enhanceButton)
    
    await waitFor(() => {
      // Should still work and show same template
      expect(screen.getByText('Enhanced Prompt')).toBeInTheDocument()
      expect(screen.getByText('CLAUDE')).toBeInTheDocument()
    })
  })

  it('should handle real input validation errors', async () => {
    const user = userEvent.setup()
    render(<PromptCraftUI />)
    
    // Try with empty input (should show client-side error)
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    
    // Button should be disabled for empty input
    expect(enhanceButton).toBeDisabled()
    
    // Try with very long input
    const veryLongPrompt = 'a'.repeat(20000)
    const textarea = screen.getByLabelText('Your Prompt:')
    await user.type(textarea, veryLongPrompt)
    
    // Button should be enabled
    expect(enhanceButton).not.toBeDisabled()
    
    await user.click(enhanceButton)
    
    // Should either succeed or show appropriate error
    await waitFor(() => {
      const hasResult = screen.queryByText('Enhanced Prompt')
      const hasError = screen.queryByText(/error/i)
      expect(hasResult || hasError).toBeTruthy()
    }, { timeout: 10000 })
  })

  it('should handle clipboard integration', async () => {
    const user = userEvent.setup()
    
    // Mock clipboard API
    const mockWriteText = jest.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: { writeText: mockWriteText }
    })
    
    render(<PromptCraftUI />)
    
    const testPrompt = 'clipboard test prompt'
    const textarea = screen.getByLabelText('Your Prompt:')
    await user.type(textarea, testPrompt)
    
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    await user.click(enhanceButton)
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Prompt')).toBeInTheDocument()
    })
    
    const copyButton = screen.getByText('📋 Copy')
    await user.click(copyButton)
    
    expect(mockWriteText).toHaveBeenCalledWith(
      expect.stringContaining(testPrompt)
    )
  })

  it('should handle responsive behavior', async () => {
    const user = userEvent.setup()
    
    // Test mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    })
    
    render(<PromptCraftUI />)
    
    // UI should still be functional on mobile
    const textarea = screen.getByLabelText('Your Prompt:')
    expect(textarea).toBeVisible()
    
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    expect(enhanceButton).toBeVisible()
    
    // Test functionality
    await user.type(textarea, 'mobile test')
    await user.click(enhanceButton)
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Prompt')).toBeInTheDocument()
    })
    
    // Result should be visible and readable on mobile
    const resultContainer = screen.getByText('Enhanced Prompt').closest('div')
    expect(resultContainer).toBeVisible()
  })

  it('should handle theme switching', () => {
    const { rerender } = render(<PromptCraftUI theme="light" />)
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    
    rerender(<PromptCraftUI theme="dark" />)
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('should handle configuration updates', async () => {
    const user = userEvent.setup()
    
    const customConfig = {
      templates: {
        custom: {
          name: 'Custom Template 🔧',
          content: 'CUSTOM: {user_input} | {model_instructions}'
        }
      },
      model_instructions: {
        default: 'Custom instructions'
      },
      keywords: {
        custom: ['custom', 'special']
      }
    }
    
    const { rerender } = render(<PromptCraftUI />)
    
    // Test with default config
    const textarea = screen.getByLabelText('Your Prompt:')
    await user.type(textarea, 'test prompt')
    
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    await user.click(enhanceButton)
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Prompt')).toBeInTheDocument()
    })
    
    // Should use default template
    expect(screen.getByText(/General Expert/)).toBeInTheDocument()
    
    // Update with custom config
    rerender(<PromptCraftUI config={customConfig} />)
    
    await user.clear(textarea)
    await user.type(textarea, 'custom special prompt')
    await user.click(enhanceButton)
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Prompt')).toBeInTheDocument()
    })
    
    // Should use custom template
    expect(screen.getByText(/Custom Template/)).toBeInTheDocument()
    
    // Enhanced prompt should contain custom content
    expect(screen.getByText(/CUSTOM:.*custom special prompt/)).toBeInTheDocument()
  })

  it('should handle error callbacks', async () => {
    const user = userEvent.setup()
    const mockOnError = jest.fn()
    
    // Create a config that will cause an error
    const brokenConfig = {
      templates: {}, // No templates
      model_instructions: { default: 'test' },
      keywords: { general: [] }
    }
    
    render(<PromptCraftUI config={brokenConfig} onError={mockOnError} />)
    
    const textarea = screen.getByLabelText('Your Prompt:')
    await user.type(textarea, 'test prompt')
    
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    await user.click(enhanceButton)
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled()
    })
    
    // Should show error in UI
    expect(screen.getByText(/error/i)).toBeInTheDocument()
  })

  it('should handle success callbacks', async () => {
    const user = userEvent.setup()
    const mockOnEnhance = jest.fn()
    
    render(<PromptCraftUI onEnhance={mockOnEnhance} />)
    
    const testPrompt = 'callback test prompt'
    const textarea = screen.getByLabelText('Your Prompt:')
    await user.type(textarea, testPrompt)
    
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    await user.click(enhanceButton)
    
    await waitFor(() => {
      expect(mockOnEnhance).toHaveBeenCalledWith(
        expect.objectContaining({
          enhanced_prompt: expect.stringContaining(testPrompt),
          template_name: expect.any(String),
          template_key: expect.any(String),
          model: expect.any(String)
        })
      )
    })
  })

  it('should handle concurrent enhancement requests', async () => {
    const user = userEvent.setup()
    render(<PromptCraftUI />)
    
    const textarea = screen.getByLabelText('Your Prompt:')
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    
    // Start first enhancement
    await user.type(textarea, 'first request')
    await user.click(enhanceButton)
    
    // Quickly change input and try again
    await user.clear(textarea)
    await user.type(textarea, 'second request')
    
    // The button might be disabled during the first request
    if (!enhanceButton.hasAttribute('disabled')) {
      await user.click(enhanceButton)
    }
    
    // Should eventually show a result
    await waitFor(() => {
      expect(screen.getByText('Enhanced Prompt')).toBeInTheDocument()
    }, { timeout: 10000 })
    
    // Should handle the requests gracefully without errors
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
  })
})