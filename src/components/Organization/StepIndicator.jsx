import './StepIndicator.css'

export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="step-indicator">
      {steps.map((step, index) => (
        <div key={step.id} className="step-item-wrapper">
          <div
            className={`step-item ${
              currentStep === step.id ? 'active' : ''
            } ${currentStep > step.id ? 'completed' : ''}`}
          >
            <div className="step-number">
              {currentStep > step.id ? '✓' : step.id}
            </div>
            <div className="step-info">
              <div className="step-title">{step.title}</div>
              <div className="step-description">{step.description}</div>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`step-connector ${
                currentStep > step.id ? 'completed' : ''
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
