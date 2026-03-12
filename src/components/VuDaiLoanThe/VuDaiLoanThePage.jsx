import React from 'react'
import { Link } from 'react-router-dom'
import VuDaiLoanThe from './index'
import './VuDaiLoanThe.css'
import './VuDaiLoanThePage.css'

/**
 * Trang riêng cho Vũ Đại Loạn Thế – cụm trang độc lập, không nằm trong WhackAMaskGame.
 * Route: /game/vu-dai-loan-the
 */
export default function VuDaiLoanThePage() {
  return (
    <div className="vdlt-page-root">
      <header className="vdlt-page-header">
        <Link to="/game" className="vdlt-page-back">
          <span className="material-symbols-outlined">arrow_back</span>
          Chọn game khác
        </Link>
        <h1 className="vdlt-page-title">
          <span className="material-symbols-outlined">theater_comedy</span>
          Vũ Đại Loạn Thế
        </h1>
        <div className="vdlt-page-spacer" />
      </header>
      <main className="vdlt-page-main">
        <VuDaiLoanThe />
      </main>
    </div>
  )
}
