import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { createOrganization, updateOrganization, submitOrganizationForReview } from '../../services/organizationService'
import StepIndicator from './StepIndicator'
import BasicInfoStep from './steps/BasicInfoStep'
import LegalInfoStep from './steps/LegalInfoStep'
import DocumentsStep from './steps/DocumentsStep'
import TermsStep from './steps/TermsStep'
import ReviewStep from './steps/ReviewStep'
import './OrganizationRegistration.css'

const STEPS = [
  { id: 1, title: 'Thông tin cơ bản', description: 'Tên, liên hệ' },
  { id: 2, title: 'Thông tin pháp lý', description: 'Giấy phép, thuế' },
  { id: 3, title: 'Tài liệu', description: 'Upload giấy tờ' },
  { id: 4, title: 'Điều khoản', description: 'Đồng ý điều khoản' },
  { id: 5, title: 'Xác nhận', description: 'Kiểm tra và gửi' }
]

export default function OrganizationRegistration() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [organizationId, setOrganizationId] = useState(null)

  // Form data
  const [formData, setFormData] = useState({
    // Type - default to theater
    type: 'theater',
    
    // Step 1: Basic info
    legal_name: '',
    display_name: '',
    description: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    website: '',
    fanpage: '',
    
    // Step 2: Legal info
    tax_code: '',
    business_license_number: '',
    legal_representative_name: '',
    legal_representative_id: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    bank_branch: '',
    
    // Step 3: Documents (handled separately)
    documents: [],
    
    // Step 4: Terms
    terms_accepted: false,
    terms_version: '1.0'
  })

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleNext = async () => {
    setError(null)
    setLoading(true)

    try {
      // Save draft on each step
      if (currentStep === 1) {
        if (!organizationId) {
          // Create new organization
          const org = await createOrganization({
            type: formData.type,
            legal_name: formData.legal_name || 'Draft',
            email: formData.email,
            phone: formData.phone || '0000000000'
          })
          setOrganizationId(org.id)
        } else {
          // Update existing
          await updateOrganization(organizationId, {
            type: formData.type,
            legal_name: formData.legal_name,
            display_name: formData.display_name,
            description: formData.description,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            website: formData.website,
            fanpage: formData.fanpage
          })
        }
      }

      if (currentStep === 3) {
        // Update legal info
        await updateOrganization(organizationId, {
          tax_code: formData.tax_code,
          business_license_number: formData.business_license_number,
          legal_representative_name: formData.legal_representative_name,
          legal_representative_id: formData.legal_representative_id,
          bank_name: formData.bank_name,
          bank_account_number: formData.bank_account_number,
          bank_account_name: formData.bank_account_name,
          bank_branch: formData.bank_branch
        })
      }

      if (currentStep === 5) {
        // Update terms acceptance
        await updateOrganization(organizationId, {
          terms_accepted_at: new Date().toISOString(),
          terms_version: formData.terms_version
        })
      }

      // Move to next step
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1)
      }
    } catch (err) {
      console.error('Error saving:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)

    try {
      // Submit for review
      await submitOrganizationForReview(organizationId)
      
      // Navigate to success page
      navigate('/organization/registration-success', {
        state: { organizationId }
      })
    } catch (err) {
      console.error('Error submitting:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            formData={formData}
            updateFormData={updateFormData}
            currentStep={currentStep}
          />
        )
      case 2:
        return (
          <LegalInfoStep
            formData={formData}
            updateFormData={updateFormData}
          />
        )
      case 3:
        return (
          <DocumentsStep
            organizationId={organizationId}
            formData={formData}
            updateFormData={updateFormData}
          />
        )
      case 4:
        return (
          <TermsStep
            formData={formData}
            updateFormData={updateFormData}
          />
        )
      case 5:
        return (
          <ReviewStep
            formData={formData}
            organizationId={organizationId}
          />
        )
      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.legal_name && formData.email && formData.phone
      case 2:
        if (formData.type === 'individual') return true
        return formData.tax_code && formData.legal_representative_name
      case 3:
        // Allow skip for testing
        return true
      case 4:
        return formData.terms_accepted
      case 5:
        return true
      default:
        return false
    }
  }

  const handleSkipDocuments = () => {
    if (currentStep === 3) {
      setCurrentStep(4)
    }
  }

  return (
    <div className="organization-registration">
      <div className="registration-container">
        <div className="registration-header">
          <h1>Đăng ký Nhà hát / Đơn vị tổ chức</h1>
          <p>Hoàn thành các bước để trở thành đối tác của chúng tôi</p>
        </div>

        <StepIndicator steps={STEPS} currentStep={currentStep} />

        <div className="registration-content">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {renderStep()}

          <div className="registration-actions">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="btn-secondary"
                disabled={loading}
              >
                ← Quay lại
              </button>
            )}

            {currentStep === 4 && (
              <button
                type="button"
                onClick={handleSkipDocuments}
                className="btn-skip"
                disabled={loading}
                title="Skip documents for testing purposes"
              >
                🧪 Skip (Test Mode)
              </button>
            )}

            {currentStep < STEPS.length ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary"
                disabled={!canProceed() || loading}
              >
                {loading ? 'Đang lưu...' : 'Tiếp tục →'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="btn-success"
                disabled={!canProceed() || loading}
              >
                {loading ? 'Đang gửi...' : '✓ Gửi đăng ký'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
