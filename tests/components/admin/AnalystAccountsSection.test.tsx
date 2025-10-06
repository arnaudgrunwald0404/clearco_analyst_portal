import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AnalystAccountsSection from '@/app/admin/AnalystAccountsSection'

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

const mockAnalysts = [
  {
    id: 'analyst-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    company: 'TechCorp',
    title: 'Senior Analyst',
    type: 'Analyst',
    influence: 'HIGH',
    status: 'ACTIVE',
    vendor_domain_id: 'domain-1',
    vendor_domain: {
      company_name: 'TechCorp',
      protected_domain: 'techcorp.com'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'analyst-2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    company: 'DataCorp',
    title: 'Principal Analyst',
    type: 'Analyst',
    influence: 'MEDIUM',
    status: 'ACTIVE',
    vendor_domain_id: 'domain-2',
    vendor_domain: {
      company_name: 'DataCorp',
      protected_domain: 'datacorp.com'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'analyst-3',
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob.johnson@example.com',
    company: 'CloudVendor',
    title: 'Research Director',
    type: 'Analyst',
    influence: 'LOW',
    status: 'INACTIVE',
    vendor_domain_id: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

const mockVendorDomains = [
  {
    id: 'domain-1',
    company_name: 'TechCorp',
    protected_domain: 'techcorp.com'
  },
  {
    id: 'domain-2',
    company_name: 'DataCorp',
    protected_domain: 'datacorp.com'
  }
]

const mockAllAnalysts = [
  {
    id: 'analyst-4',
    firstName: 'Alice',
    lastName: 'Wilson',
    email: 'alice.wilson@example.com',
    company: 'NewCorp',
    hasLoginAccess: false
  }
]

beforeEach(() => {
  jest.clearAllMocks()
  
  // Setup default successful API responses
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/api/admin/analysts')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockAnalysts })
      })
    }
    if (url.includes('/api/admin/vendor-domains')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockVendorDomains })
      })
    }
    if (url.includes('/api/admin/all-analysts')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockAllAnalysts })
      })
    }
    if (url.includes('/api/admin/remove-analyst-access')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          message: 'Successfully removed access for 2 analysts',
          removedCount: 2
        })
      })
    }
    return Promise.reject(new Error('Unknown API endpoint'))
  })
})

describe('AnalystAccountsSection - Bulk Deletion', () => {
  describe('Checkbox Selection', () => {
    it('should render checkboxes for each analyst row', async () => {
      render(<AnalystAccountsSection />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Check for header checkbox
      const headerCheckbox = screen.getByRole('checkbox', { name: /select all/i })
      expect(headerCheckbox).toBeInTheDocument()

      // Check for individual row checkboxes
      const rowCheckboxes = screen.getAllByRole('checkbox')
      expect(rowCheckboxes).toHaveLength(4) // 1 header + 3 analysts
    })

    it('should allow selecting individual analysts', async () => {
      const user = userEvent.setup()
      render(<AnalystAccountsSection />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const rowCheckboxes = screen.getAllByRole('checkbox')
      const firstAnalystCheckbox = rowCheckboxes[1] // Skip header checkbox

      await user.click(firstAnalystCheckbox)
      
      expect(firstAnalystCheckbox).toBeChecked()
      expect(screen.getByText('• 1 selected')).toBeInTheDocument()
    })

    it('should allow selecting all analysts with header checkbox', async () => {
      const user = userEvent.setup()
      render(<AnalystAccountsSection />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const headerCheckbox = screen.getAllByRole('checkbox')[0]
      await user.click(headerCheckbox)
      
      expect(headerCheckbox).toBeChecked()
      expect(screen.getByText('• 3 selected')).toBeInTheDocument()
      
      // All individual checkboxes should be checked
      const rowCheckboxes = screen.getAllByRole('checkbox')
      rowCheckboxes.slice(1).forEach(checkbox => {
        expect(checkbox).toBeChecked()
      })
    })

    it('should deselect all when header checkbox is clicked again', async () => {
      const user = userEvent.setup()
      render(<AnalystAccountsSection />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const headerCheckbox = screen.getAllByRole('checkbox')[0]
      
      // Select all
      await user.click(headerCheckbox)
      expect(screen.getByText('• 3 selected')).toBeInTheDocument()
      
      // Deselect all
      await user.click(headerCheckbox)
      expect(screen.queryByText('• 3 selected')).not.toBeInTheDocument()
      
      // All checkboxes should be unchecked
      const rowCheckboxes = screen.getAllByRole('checkbox')
      rowCheckboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked()
      })
    })

    it('should show clear selection button when analysts are selected', async () => {
      const user = userEvent.setup()
      render(<AnalystAccountsSection />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Initially no clear button
      expect(screen.queryByText('Clear Selection')).not.toBeInTheDocument()

      // Select an analyst
      const rowCheckboxes = screen.getAllByRole('checkbox')
      await user.click(rowCheckboxes[1])
      
      // Clear button should appear
      expect(screen.getByText('Clear Selection')).toBeInTheDocument()
      
      // Click clear button
      await user.click(screen.getByText('Clear Selection'))
      
      // Selection should be cleared
      expect(screen.queryByText('• 1 selected')).not.toBeInTheDocument()
      expect(screen.queryByText('Clear Selection')).not.toBeInTheDocument()
    })
  })

  describe('Bulk Delete Button', () => {
    it('should show remove access button when analysts are selected', async () => {
      const user = userEvent.setup()
      render(<AnalystAccountsSection />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Initially no remove button
      expect(screen.queryByText(/Remove Access/)).not.toBeInTheDocument()

      // Select analysts
      const rowCheckboxes = screen.getAllByRole('checkbox')
      await user.click(rowCheckboxes[1])
      await user.click(rowCheckboxes[2])
      
      // Remove button should appear with count
      expect(screen.getByText('Remove Access (2)')).toBeInTheDocument()
    })

    it('should update button count when selection changes', async () => {
      const user = userEvent.setup()
      render(<AnalystAccountsSection />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const rowCheckboxes = screen.getAllByRole('checkbox')
      
      // Select one analyst
      await user.click(rowCheckboxes[1])
      expect(screen.getByText('Remove Access (1)')).toBeInTheDocument()
      
      // Select another analyst
      await user.click(rowCheckboxes[2])
      expect(screen.getByText('Remove Access (2)')).toBeInTheDocument()
      
      // Deselect one analyst
      await user.click(rowCheckboxes[1])
      expect(screen.getByText('Remove Access (1)')).toBeInTheDocument()
    })
  })

  describe('Bulk Delete Modal', () => {
    it('should open confirmation modal when remove access button is clicked', async () => {
      const user = userEvent.setup()
      render(<AnalystAccountsSection />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Select analysts and click remove button
      const rowCheckboxes = screen.getAllByRole('checkbox')
      await user.click(rowCheckboxes[1])
      await user.click(rowCheckboxes[2])
      
      const removeButton = screen.getByText('Remove Access (2)')
      await user.click(removeButton)
      
      // Modal should open
      expect(screen.getByText('Remove Analyst Access')).toBeInTheDocument()
      expect(screen.getByText(/Are you sure you want to remove login access for 2 analysts/)).toBeInTheDocument()
    })

    it('should show correct singular/plural text in modal', async () => {
      const user = userEvent.setup()
      render(<AnalystAccountsSection />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Select one analyst
      const rowCheckboxes = screen.getAllByRole('checkbox')
      await user.click(rowCheckboxes[1])
      
      const removeButton = screen.getByText('Remove Access (1)')
      await user.click(removeButton)
      
      // Modal should show singular text
      expect(screen.getByText(/Are you sure you want to remove login access for 1 analyst\?/)).toBeInTheDocument()
    })

    it('should allow canceling the deletion', async () => {
      const user = userEvent.setup()
      render(<AnalystAccountsSection />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Select analysts and open modal
      const rowCheckboxes = screen.getAllByRole('checkbox')
      await user.click(rowCheckboxes[1])
      
      const removeButton = screen.getByText('Remove Access (1)')
      await user.click(removeButton)
      
      // Click cancel
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      
      // Modal should close
      expect(screen.queryByText('Remove Analyst Access')).not.toBeInTheDocument()
      
      // Selection should remain
      expect(screen.getByText('• 1 selected')).toBeInTheDocument()
    })
  })

  describe('Bulk Delete Execution', () => {
    it('should successfully delete selected analysts', async () => {
      const user = userEvent.setup()
      const { toast } = require('sonner')
      
      render(<AnalystAccountsSection />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Select analysts
      const rowCheckboxes = screen.getAllByRole('checkbox')
      await user.click(rowCheckboxes[1])
      await user.click(rowCheckboxes[2])
      
      // Open modal and confirm deletion
      const removeButton = screen.getByText('Remove Access (2)')
      await user.click(removeButton)
      
      const confirmButton = screen.getByText('Remove Access')
      await user.click(confirmButton)
      
      // Wait for API call and success
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/remove-analyst-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ analystIds: ['analyst-1', 'analyst-2'] }),
        })
      })
      
      // Success toast should be shown
      expect(toast.success).toHaveBeenCalledWith('Successfully removed access for 2 analysts')
      
      // Modal should close and selection should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Remove Analyst Access')).not.toBeInTheDocument()
        expect(screen.queryByText('• 2 selected')).not.toBeInTheDocument()
      })
    })

    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup()
      const { toast } = require('sonner')
      
      // Mock API error
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/admin/remove-analyst-access')) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ 
              success: false, 
              error: 'Database connection failed'
            })
          })
        }
        // Return default responses for other endpoints
        if (url.includes('/api/admin/analysts')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockAnalysts })
          })
        }
        if (url.includes('/api/admin/vendor-domains')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockVendorDomains })
          })
        }
        if (url.includes('/api/admin/all-analysts')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockAllAnalysts })
          })
        }
        return Promise.reject(new Error('Unknown API endpoint'))
      })
      
      render(<AnalystAccountsSection />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Select analysts and attempt deletion
      const rowCheckboxes = screen.getAllByRole('checkbox')
      await user.click(rowCheckboxes[1])
      
      const removeButton = screen.getByText('Remove Access (1)')
      await user.click(removeButton)
      
      const confirmButton = screen.getByText('Remove Access')
      await user.click(confirmButton)
      
      // Wait for error handling
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Database connection failed')
      })
    })

    it('should show loading state during deletion', async () => {
      const user = userEvent.setup()
      
      // Mock delayed API response
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/admin/remove-analyst-access')) {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve({ 
                  success: true, 
                  message: 'Successfully removed access for 1 analyst',
                  removedCount: 1
                })
              })
            }, 100)
          })
        }
        // Return default responses for other endpoints
        if (url.includes('/api/admin/analysts')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockAnalysts })
          })
        }
        if (url.includes('/api/admin/vendor-domains')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockVendorDomains })
          })
        }
        if (url.includes('/api/admin/all-analysts')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockAllAnalysts })
          })
        }
        return Promise.reject(new Error('Unknown API endpoint'))
      })
      
      render(<AnalystAccountsSection />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Select analyst and start deletion
      const rowCheckboxes = screen.getAllByRole('checkbox')
      await user.click(rowCheckboxes[1])
      
      const removeButton = screen.getByText('Remove Access (1)')
      await user.click(removeButton)
      
      const confirmButton = screen.getByText('Remove Access')
      await user.click(confirmButton)
      
      // Should show loading state
      expect(screen.getByText('Removing Access...')).toBeInTheDocument()
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText('Removing Access...')).not.toBeInTheDocument()
      }, { timeout: 200 })
    })

    it('should handle partial success responses', async () => {
      const user = userEvent.setup()
      const { toast } = require('sonner')
      
      // Mock partial success response
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/admin/remove-analyst-access')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              success: true, 
              message: 'Successfully removed access for 1 analyst',
              removedCount: 1,
              errors: ['Failed to remove access for Jane Smith: User not found'],
              partialSuccess: true
            })
          })
        }
        // Return default responses for other endpoints
        if (url.includes('/api/admin/analysts')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockAnalysts })
          })
        }
        if (url.includes('/api/admin/vendor-domains')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockVendorDomains })
          })
        }
        if (url.includes('/api/admin/all-analysts')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockAllAnalysts })
          })
        }
        return Promise.reject(new Error('Unknown API endpoint'))
      })
      
      render(<AnalystAccountsSection />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Select analysts and attempt deletion
      const rowCheckboxes = screen.getAllByRole('checkbox')
      await user.click(rowCheckboxes[1])
      await user.click(rowCheckboxes[2])
      
      const removeButton = screen.getByText('Remove Access (2)')
      await user.click(removeButton)
      
      const confirmButton = screen.getByText('Remove Access')
      await user.click(confirmButton)
      
      // Should show success message for partial success
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Successfully removed access for 1 analyst')
      })
    })
  })

  describe('Data Refresh', () => {
    it('should refresh analyst data after successful deletion', async () => {
      const user = userEvent.setup()
      
      render(<AnalystAccountsSection />)
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Select and delete analyst
      const rowCheckboxes = screen.getAllByRole('checkbox')
      await user.click(rowCheckboxes[1])
      
      const removeButton = screen.getByText('Remove Access (1)')
      await user.click(removeButton)
      
      const confirmButton = screen.getByText('Remove Access')
      await user.click(confirmButton)
      
      // Wait for completion and verify data refresh calls
      await waitFor(() => {
        // Should call fetchAnalysts and fetchAllAnalysts again
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/analysts')
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/all-analysts')
      })
    })
  })
})
