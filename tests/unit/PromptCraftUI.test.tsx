import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PromptCraftUI from '../../src/PromptCraftUI'
import type { PromptCraftUIProps } from '../../src/types'

// Mock the utils module
jest.mock('../../src/utils', () => ({
  enhancePrompt: jest.fn(),
  createDefaultConfig: jest.fn(() => ({
    templates: {
      general: {
        name: 'General Expert',
        content: 'Task: {user_input}\n{model_instructions}'
      },
      code: {
        name: 'Code Generator',
        content: 'Code: {user_input}\n{model_instructions}'
      }
    },
    model_instructions: {
      default: 'Be helpful',
      gpt4: 'Use advanced reasoning'
    },
    keywords: {
      code: ['code', 'function'],
      general: []
    }
  })),
  ValidationError: class ValidationError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'ValidationError'
    }
  },
  ConfigurationError: class ConfigurationError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'ConfigurationError'
    }
  }
}))

const mockEnhancePrompt = require('../../src/utils').enhancePrompt as jest.MockedFunction<any>

describe('PromptCraftUI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockEnhancePrompt.mockResolvedValue({
      enhanced_prompt: 'Enhanced: test prompt\nBe helpful',
      template_name: 'General Expert',
      template_key: 'general',
      model: 'default'
    })
  })

  it('should render the basic UI elements', () => {
    render(<PromptCraftUI />)
    
    expect(screen.getByText('✨ PromptCraft')).toBeInTheDocument()
    expect(screen.getByText('Neural Prompt Enhancement System')).toBeInTheDocument()
    expect(screen.getByLabelText('Your Prompt:')).toBeInTheDocument()
    expect(screen.getByLabelText('Target Model:')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enhance prompt/i })).toBeInTheDocument()
  })

  it('should have default model selected', () => {
    render(<PromptCraftUI />)
    
    const modelSelect = screen.getByLabelText('Target Model:') as HTMLSelectElement
    expect(modelSelect.value).toBe('default')
  })

  it('should use custom default model', () => {
    render(<PromptCraftUI defaultModel="gpt4" />)
    
    const modelSelect = screen.getByLabelText('Target Model:') as HTMLSelectElement
    expect(modelSelect.value).toBe('gpt4')
  })

  it('should disable enhance button when input is empty', () => {
    render(<PromptCraftUI />)
    
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    expect(enhanceButton).toBeDisabled()
  })

  it('should enable enhance button when input is provided', async () => {
    const user = userEvent.setup()
    render(<PromptCraftUI />)
    
    const textarea = screen.getByLabelText('Your Prompt:')
    await user.type(textarea, 'test prompt')
    
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    expect(enhanceButton).not.toBeDisabled()
  })

  it('should enhance prompt when button is clicked', async () => {
    const user = userEvent.setup()
    render(<PromptCraftUI />)
    
    const textarea = screen.getByLabelText('Your Prompt:')
    await user.type(textarea, 'test prompt')
    
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    await user.click(enhanceButton)
    
    await waitFor(() => {
      expect(mockEnhancePrompt).toHaveBeenCalledWith(
        expect.any(Object),
        'test prompt',
        { model: 'default' }
      )
    })
  })

  it('should display enhanced result', async () => {
    const user = userEvent.setup()
    render(<PromptCraftUI />)
    
    const textarea = screen.getByLabelText('Your Prompt:')
    await user.type(textarea, 'test prompt')
    
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    await user.click(enhanceButton)
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Prompt')).toBeInTheDocument()
      expect(screen.getByText('General Expert')).toBeInTheDocument()
      expect(screen.getByText('DEFAULT')).toBeInTheDocument()
      expect(screen.getByText('Enhanced: test prompt\nBe helpful')).toBeInTheDocument()
    })
  })

  it('should show loading state during enhancement', async () => {
    const user = userEvent.setup()
    
    // Mock a delayed response
    mockEnhancePrompt.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        enhanced_prompt: 'Enhanced prompt',
        template_name: 'General Expert',
        template_key: 'general',
        model: 'default'
      }), 100))
    )
    
    render(<PromptCraftUI />)
    
    const textarea = screen.getByLabelText('Your Prompt:')
    await user.type(textarea, 'test prompt')
    
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    await user.click(enhanceButton)
    
    expect(screen.getByText('Enhancing...')).toBeInTheDocument()
    expect(enhanceButton).toBeDisabled()
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Prompt')).toBeInTheDocument()
    })
  })

  it('should handle enhancement errors', async () => {
    const user = userEvent.setup()
    const mockOnError = jest.fn()
    
    mockEnhancePrompt.mockRejectedValue(new Error('Enhancement failed'))
    
    render(<PromptCraftUI onError={mockOnError} />)
    
    const textarea = screen.getByLabelText('Your Prompt:')
    await user.type(textarea, 'test prompt')
    
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    await user.click(enhanceButton)
    
    await waitFor(() => {
      expect(screen.getByText(/error.*enhancement failed/i)).toBeInTheDocument()
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  it('should show error for empty input', async () => {
    const user = userEvent.setup()
    render(<PromptCraftUI />)
    
    // Try to enhance without input
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    
    // Force click even though button is disabled
    fireEvent.click(enhanceButton)
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a prompt/i)).toBeInTheDocument()
    })
  })

  it('should call onEnhance callback when enhancement succeeds', async () => {
    const user = userEvent.setup()
    const mockOnEnhance = jest.fn()
    
    render(<PromptCraftUI onEnhance={mockOnEnhance} />)
    
    const textarea = screen.getByLabelText('Your Prompt:')
    await user.type(textarea, 'test prompt')
    
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    await user.click(enhanceButton)
    
    await waitFor(() => {
      expect(mockOnEnhance).toHaveBeenCalledWith({
        enhanced_prompt: 'Enhanced: test prompt\nBe helpful',
        template_name: 'General Expert',
        template_key: 'general',
        model: 'default'
      })
    })
  })

  it('should handle model selection changes', async () => {
    const user = userEvent.setup()
    render(<PromptCraftUI />)
    
    const modelSelect = screen.getByLabelText('Target Model:')
    await user.selectOptions(modelSelect, 'gpt4')
    
    expect((modelSelect as HTMLSelectElement).value).toBe('gpt4')
    
    const textarea = screen.getByLabelText('Your Prompt:')
    await user.type(textarea, 'test prompt')
    
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    await user.click(enhanceButton)
    
    await waitFor(() => {
      expect(mockEnhancePrompt).toHaveBeenCalledWith(
        expect.any(Object),
        'test prompt',
        { model: 'gpt4' }
      )
    })
  })

  it('should copy to clipboard when copy button is clicked', async () => {
    const user = userEvent.setup()
    const mockWriteText = jest.fn().mockResolvedValue(undefined)
    
    Object.assign(navigator, {
      clipboard: { writeText: mockWriteText }
    })
    
    render(<PromptCraftUI />)
    
    const textarea = screen.getByLabelText('Your Prompt:')
    await user.type(textarea, 'test prompt')
    
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    await user.click(enhanceButton)
    
    await waitFor(() => {
      expect(screen.getByText('📋 Copy')).toBeInTheDocument()
    })
    
    const copyButton = screen.getByText('📋 Copy')
    await user.click(copyButton)
    
    expect(mockWriteText).toHaveBeenCalledWith('Enhanced: test prompt\nBe helpful')
  })

  it('should handle clipboard copy errors gracefully', async () => {
    const user = userEvent.setup()
    const mockWriteText = jest.fn().mockRejectedValue(new Error('Clipboard error'))
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
    
    Object.assign(navigator, {
      clipboard: { writeText: mockWriteText }
    })
    
    render(<PromptCraftUI />)
    
    const textarea = screen.getByLabelText('Your Prompt:')
    await user.type(textarea, 'test prompt')
    
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    await user.click(enhanceButton)
    
    await waitFor(() => {
      expect(screen.getByText('📋 Copy')).toBeInTheDocument()
    })
    
    const copyButton = screen.getByText('📋 Copy')
    await user.click(copyButton)
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to copy to clipboard:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })

  it('should update config when userConfig prop changes', () => {
    const initialConfig = {
      templates: {
        custom: {
          name: 'Custom Template',
          content: 'Custom: {user_input}'
        }
      }
    }
    
    const { rerender } = render(<PromptCraftUI config={initialConfig} />)
    
    const updatedConfig = {
      templates: {
        updated: {
          name: 'Updated Template',
          content: 'Updated: {user_input}'
        }
      }
    }
    
    rerender(<PromptCraftUI config={updatedConfig} />)
    
    // The component should handle the config update
    // This is mainly testing that no errors occur during re-render
    expect(screen.getByText('✨ PromptCraft')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<PromptCraftUI className="custom-class" />)
    
    expect(container.querySelector('.promptcraft-ui.custom-class')).toBeInTheDocument()
  })

  it('should handle theme prop', () => {
    render(<PromptCraftUI theme="dark" />)
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('should handle auto theme with matchMedia', () => {
    const mockMatchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }))
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia
    })
    
    render(<PromptCraftUI theme="auto" />)
    
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
  })

  it('should disable form elements during loading', async () => {
    const user = userEvent.setup()
    
    // Mock a delayed response
    mockEnhancePrompt.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        enhanced_prompt: 'Enhanced prompt',
        template_name: 'General Expert',
        template_key: 'general',
        model: 'default'
      }), 100))
    )
    
    render(<PromptCraftUI />)
    
    const textarea = screen.getByLabelText('Your Prompt:')
    const modelSelect = screen.getByLabelText('Target Model:')
    
    await user.type(textarea, 'test prompt')
    
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    await user.click(enhanceButton)
    
    expect(textarea).toBeDisabled()
    expect(modelSelect).toBeDisabled()
    expect(enhanceButton).toBeDisabled()
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Prompt')).toBeInTheDocument()
    })
    
    expect(textarea).not.toBeDisabled()
    expect(modelSelect).not.toBeDisabled()
    expect(enhanceButton).not.toBeDisabled()
  })

  it('should maintain form state after enhancement', async () => {
    const user = userEvent.setup()
    render(<PromptCraftUI />)
    
    const textarea = screen.getByLabelText('Your Prompt:')
    const modelSelect = screen.getByLabelText('Target Model:')
    
    await user.type(textarea, 'test prompt')
    await user.selectOptions(modelSelect, 'gpt4')
    
    const enhanceButton = screen.getByRole('button', { name: /enhance prompt/i })
    await user.click(enhanceButton)
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Prompt')).toBeInTheDocument()
    })
    
    expect((textarea as HTMLTextAreaElement).value).toBe('test prompt')
    expect((modelSelect as HTMLSelectElement).value).toBe('gpt4')
  })
})