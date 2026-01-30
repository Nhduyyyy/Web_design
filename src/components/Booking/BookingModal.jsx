import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SeatSelection from './SeatSelection'
import BookingSummary from './BookingSummary'
import PaymentMethod from './PaymentMethod'
import Confirmation from './Confirmation'
import { generateSeatingChart, calculateTotal, generateBookingId, processPayment, sendEmailConfirmation, sendSMSConfirmation, scheduleReminder } from '../../utils/booking'
import './booking.css'

const STEPS = {
  SELECT_SHOW: 1,
  SELECT_SEATS: 2,
  SUMMARY: 3,
  PAYMENT: 4,
  CONFIRMATION: 5
}

export default function BookingModal({ event, isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(STEPS.SELECT_SHOW)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [seatingChart, setSeatingChart] = useState([])
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [paymentMethod, setPaymentMethod] = useState(null)
  const [paymentResult, setPaymentResult] = useState(null)
  const [bookingId, setBookingId] = useState(null)

  // Initialize seating chart when modal opens
  useEffect(() => {
    if (isOpen && event) {
      const chart = generateSeatingChart(10, 12)
      setSeatingChart(chart)
      // Skip step 1 (select show) since event is already selected, go directly to seat selection
      setCurrentStep(STEPS.SELECT_SEATS)
      setSelectedSeats([])
      setCustomerInfo({ name: '', email: '', phone: '' })
      setPaymentMethod(null)
      setPaymentResult(null)
      setBookingId(null)
    }
  }, [isOpen, event])

  const handleSeatsSelected = (seats) => {
    setSelectedSeats(seats)
    setCurrentStep(STEPS.SUMMARY)
  }

  const handleSummaryContinue = (info) => {
    setCustomerInfo(info)
    setBookingId(generateBookingId())
    setCurrentStep(STEPS.PAYMENT)
  }

  const handlePayment = async (method, amount) => {
    setPaymentMethod(method)
    const result = await processPayment(method, amount, bookingId)
    setPaymentResult(result)
    
    if (result.success) {
      // Send confirmations
      const booking = {
        bookingId,
        event,
        selectedSeats,
        total: amount,
        customerInfo,
        paymentMethod: method
      }
      
      await sendEmailConfirmation({ ...booking, customerEmail: customerInfo.email })
      await sendSMSConfirmation({ ...booking, customerPhone: customerInfo.phone })
      scheduleReminder(event, booking)
      
      setCurrentStep(STEPS.CONFIRMATION)
    }
  }

  const handleBack = () => {
    if (currentStep > STEPS.SELECT_SEATS) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    if (currentStep === STEPS.CONFIRMATION || window.confirm('Bạn có chắc muốn hủy đặt vé?')) {
      onClose()
    }
  }

  if (!isOpen || !event) return null

  const total = calculateTotal(selectedSeats)

  return (
    <AnimatePresence>
      <div className="booking-modal-overlay" onClick={handleClose}>
        <motion.div
          className="booking-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="booking-modal-close" onClick={handleClose}>✕</button>
          
          {/* Progress Steps */}
          <div className="booking-progress">
            <div className="progress-step completed">
              <div className="step-number">1</div>
              <div className="step-label">Chọn suất</div>
            </div>
            <div className={`progress-step ${currentStep >= STEPS.SELECT_SEATS ? 'active' : ''} ${currentStep > STEPS.SELECT_SEATS ? 'completed' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Chọn ghế</div>
            </div>
            <div className={`progress-step ${currentStep >= STEPS.SUMMARY ? 'active' : ''} ${currentStep > STEPS.SUMMARY ? 'completed' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Tóm tắt</div>
            </div>
            <div className={`progress-step ${currentStep >= STEPS.PAYMENT ? 'active' : ''} ${currentStep > STEPS.PAYMENT ? 'completed' : ''}`}>
              <div className="step-number">4</div>
              <div className="step-label">Thanh toán</div>
            </div>
            <div className={`progress-step ${currentStep >= STEPS.CONFIRMATION ? 'active' : ''} ${currentStep > STEPS.CONFIRMATION ? 'completed' : ''}`}>
              <div className="step-number">5</div>
              <div className="step-label">Xác nhận</div>
            </div>
          </div>

          {/* Step Content */}
          <div className="booking-content">
            {/* Show event info at the top for all steps */}
            <div className="event-info-header">
              <h3>{event.title}</h3>
              <div className="event-info-meta">
                <span>📅 {new Date(event.startDatetime).toLocaleString('vi-VN')}</span>
                <span>📍 {event.venue?.name}, {event.venue?.city}</span>
              </div>
            </div>

            {currentStep === STEPS.SELECT_SEATS && (
              <SeatSelection
                seatingChart={seatingChart}
                selectedSeats={selectedSeats}
                onSeatsChange={setSelectedSeats}
                onContinue={() => handleSeatsSelected(selectedSeats)}
                onBack={handleBack}
                event={event}
              />
            )}

            {currentStep === STEPS.SUMMARY && (
              <BookingSummary
                event={event}
                selectedSeats={selectedSeats}
                total={total}
                customerInfo={customerInfo}
                onInfoChange={setCustomerInfo}
                onContinue={handleSummaryContinue}
                onBack={handleBack}
              />
            )}

            {currentStep === STEPS.PAYMENT && (
              <PaymentMethod
                total={total}
                bookingId={bookingId}
                onPayment={handlePayment}
                onBack={handleBack}
                paymentResult={paymentResult}
              />
            )}

            {currentStep === STEPS.CONFIRMATION && (
              <Confirmation
                bookingId={bookingId}
                event={event}
                selectedSeats={selectedSeats}
                total={total}
                customerInfo={customerInfo}
                paymentMethod={paymentMethod}
                paymentResult={paymentResult}
                onClose={handleClose}
              />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
