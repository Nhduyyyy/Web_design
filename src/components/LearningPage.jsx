import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './LearningPage.css'

const SECTIONS = [
  { id: 'intro', label: 'Giới thiệu', short: '1' },
  { id: 'characters', label: 'Mô hình nhân vật', short: '2' },
  { id: 'practice', label: 'Thử sức', short: '3' },
]

const CHARACTER_MODELS = [
  {
    id: 'dao',
    title: 'Mô hình nhân vật Đào',
    shortLabel: 'Đào',
    image: '/characters/nv đào.png',
    color: 'rose',
    content:
      'Mô hình nhân vật Đào trong tuồng dùng để chỉ các nhân vật nữ còn trẻ, từ độ tuổi thanh niên đến trung niên. Đây là mô hình mang tính biểu cảm cao, thể hiện rõ nét vẻ đẹp, số phận và tâm lý của người phụ nữ trong xã hội phong kiến. Nhân vật đào được chia thành nhiều loại khác nhau. Đào võ là những nhân vật nữ mạnh mẽ, có võ nghệ, phong cách biểu diễn khỏe khoắn, động tác dứt khoát, giọng hát vang và sắc thái gương mặt cứng cỏi. Ngược lại, đào bi là những nhân vật nữ hiền thục, chịu nhiều bi kịch, có giọng hát mềm mại, động tác uyển chuyển, thướt tha, thể hiện rõ yếu tố trữ tình. Đào lẵng là kiểu nhân vật có tính cách lả lơi, quyến rũ, gian xảo, điệu bộ uốn éo, giọng hát luyến láy. Ngoài ra, đào điên là những nhân vật có trạng thái tâm lý bất ổn, lúc tỉnh lúc điên, ánh mắt linh hoạt, tiếng cười kéo dài tạo cảm giác rùng rợn, góp phần làm tăng kịch tính cho vở diễn.',
  },
  {
    id: 'kep',
    title: 'Mô hình nhân vật Kép',
    shortLabel: 'Kép',
    image: '/characters/nv kép.png',
    color: 'gold',
    content:
      'Mô hình nhân vật Kép dùng để chỉ các nhân vật nam trẻ tuổi, từ thanh niên đến trung niên, giữ vai trò quan trọng trong cấu trúc kịch tuồng. Kép văn là những nhân vật có phong thái tao nhã, điềm đạm, giọng hát trong trẻo, động tác mềm mại, thường đại diện cho tầng lớp trí thức hoặc quan văn. Kép võ là những nhân vật nam mang tính cách mạnh mẽ, trung thực, có nhiệm vụ trừ gian diệt ác, bảo vệ chính nghĩa; lối múa khỏe, sắc nét, giọng hát vang, đôi mắt và lông mày được hóa trang đậm, xếch ngược tạo thần thái cương nghị. Kép văn pha võ là dạng nhân vật vừa có trí tuệ, phong thái mực thước, vừa có bản lĩnh võ nghệ, biểu diễn chững chạc, hào hoa. Ngoài ra còn có các dạng kép xéo, được phân biệt qua màu sắc hóa trang để thể hiện tính cách và địa vị xã hội khác nhau; kép rằn mang phong cách bạo liệt, dữ dội; và kép con là những nhân vật thiếu nhi với giọng hát trong trẻo, động tác đơn giản, gương mặt hóa trang nhẹ, lấy đôi mắt làm điểm nhấn.',
  },
  {
    id: 'tuong',
    title: 'Mô hình nhân vật Tướng',
    shortLabel: 'Tướng',
    image: '/characters/nv tướng.png',
    color: 'crimson',
    content:
      'Mô hình nhân vật Tướng trong tuồng chỉ những nhân vật giữ chức quan võ trong triều đình, có thể là nam hoặc nữ, phần lớn mang màu sắc phản diện. Các nhân vật tướng thường được hóa trang đậm, phục trang cầu kỳ, động tác mạnh mẽ để thể hiện quyền lực và sự uy hiếp. Tướng lớn là những nhân vật có địa vị cao, tính cách dữ dội, tàn bạo, hung ác, thường là trung tâm của tuyến phản diện. Tướng nhỏ là những nhân vật có vai trò phụ, hành động lăng xăng, thái độ ba phải, góp phần làm nổi bật sự rối ren và suy đồi của bộ máy quyền lực trong kịch bản tuồng.',
  },
  {
    id: 'ninh',
    title: 'Mô hình nhân vật Nịnh',
    shortLabel: 'Nịnh',
    image: '/characters/nv nịnh.png',
    color: 'indigo',
    content:
      'Mô hình nhân vật Nịnh là hình tượng tiêu biểu cho các gian thần, kẻ xu thời nịnh thế, phản quốc hoặc phản chủ. Nhân vật nịnh thường được khắc họa với dáng đi rình rập, ánh mắt láo liên, cử chỉ uốn éo và lời nói không đi đôi với hành động. Nịnh gộc là dạng nịnh lớn, có địa vị xã hội cao, mưu mô sâu hiểm, tạo được bè cánh và thế lực xung quanh. Nịnh mụt là dạng nịnh nhỡ, thế lực yếu, thường đơn độc, hay dựa dẫm vào người khác. Nịnh chẩu là loại nịnh nhỏ, nông nổi, thiếu lập trường, dễ thay đổi thái độ theo hoàn cảnh. Mô hình nịnh góp phần tạo nên tính đối kháng gay gắt và chiều sâu phê phán xã hội trong tuồng.',
  },
  {
    id: 'lao',
    title: 'Mô hình nhân vật Lão',
    shortLabel: 'Lão',
    image: '/characters/nv lão.png',
    color: 'gold',
    content:
      'Mô hình nhân vật Lão dùng để chỉ các nhân vật nam cao tuổi, thường từ bảy mươi đến tám mươi. Lão văn là những nhân vật có phong thái điềm tĩnh, mực thước, giọng hát chậm rãi, đại diện cho những bậc trung thần hoặc người từng trải. Lão võ là các võ tướng lớn tuổi, có lối múa tròn trĩnh, cứng cáp, giọng hát to và rõ, thể hiện khí phách dù tuổi đã cao. Ngoài ra còn có lão tiều và lão chài, là những nhân vật mang tính cách mộc mạc, chân chất, phản ánh hình ảnh người lao động bình dân trong xã hội.',
  },
  {
    id: 'mu',
    title: 'Mô hình nhân vật Mụ',
    shortLabel: 'Mụ',
    image: '/characters/nv mụ.png',
    color: 'rose',
    content:
      'Mô hình nhân vật Mụ dùng để chỉ các nhân vật nữ lớn tuổi, thường giữ vai trò phụ nhưng có ảnh hưởng lớn đến diễn biến kịch. Mụ quý tộc có phong cách biểu diễn chững chạc, sắc sảo, đại diện cho tầng lớp quyền quý. Mụ ác là những nhân vật phản diện, có tính cách tàn nhẫn, độc đoán. Bên cạnh đó, mụ tiều và mụ chài là những nhân vật dân gian, có cử chỉ, điệu bộ và trang phục giản dị, gần gũi với đời sống thường ngày.',
  },
  {
    id: 'khac',
    title: 'Một số mô hình nhân vật khác',
    shortLabel: 'Khác',
    image: '/characters/nv yêu đạo.png',
    color: 'indigo',
    content:
      'Ngoài các mô hình chính, tuồng còn xuất hiện những nhân vật đặc biệt như yêu đạo, tiên và hề. Nhân vật yêu đạo mang yếu tố siêu nhiên, thường là phản diện, hóa thân từ các loài vật khác nhau. Nhân vật tiên có thể là nam hoặc nữ, già hoặc trẻ, sở hữu phép thần thông, thường xuất hiện để cứu giúp người lương thiện trong lúc nguy nan. Nhân vật hề mang tính chất hài hước, châm biếm, từ diện mạo, phục trang đến lời nói, động tác đều mang tính méo mó, góp phần giảm căng thẳng và phản ánh tiếng nói dân gian trên sân khấu tuồng.',
  },
]

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: 'Tuồng (hát bội) là loại hình nghệ thuật sân khấu đặc trưng bởi yếu tố nào sau đây?',
    options: [
      'Diễn xuất hoàn toàn tự nhiên như đời sống',
      'Biểu diễn ngẫu hứng, không theo quy ước',
      'Tính ước lệ, cách điệu và tượng trưng cao',
      'Chủ yếu kể chuyện sinh hoạt thường ngày',
    ],
    correctIndex: 2,
    explain: 'Tuồng nổi bật với tính ước lệ, cách điệu và tượng trưng cao trong hát, múa và hóa trang.',
  },
  {
    id: 2,
    question: 'Nhân vật nữ trẻ tuổi, giỏi võ nghệ, phong cách biểu diễn khỏe khoắn trong tuồng được gọi là gì?',
    options: ['Đào bi', 'Đào lẵng', 'Đào võ', 'Mụ quý tộc'],
    correctIndex: 2,
    explain: 'Đào võ là nhân vật nữ mạnh mẽ, có võ nghệ, phong cách biểu diễn khỏe khoắn, động tác dứt khoát.',
  },
  {
    id: 3,
    question: 'Nhân vật nam trẻ tuổi, mang trọng trách trừ gian diệt ác, có lối múa khỏe và giọng hát vang thường thuộc mô hình nào?',
    options: ['Kép văn', 'Kép võ', 'Lão võ', 'Tướng nhỏ'],
    correctIndex: 1,
    explain: 'Kép võ là nhân vật nam mạnh mẽ, trung thực, trừ gian diệt ác; lối múa khỏe, giọng hát vang.',
  },
  {
    id: 4,
    question: 'Mô hình nhân vật nào trong tuồng thường đại diện cho gian thần, xu thời nịnh thế và có nhiều mưu mô xảo quyệt?',
    options: ['Tướng', 'Lão', 'Nịnh', 'Hề'],
    correctIndex: 2,
    explain: 'Nhân vật Nịnh là hình tượng tiêu biểu cho gian thần, kẻ xu thời nịnh thế, mưu mô sâu hiểm.',
  },
  {
    id: 5,
    question: 'Nhân vật có dáng vẻ hài hước, lời nói châm biếm, góp phần tạo tiếng cười và giảm căng thẳng cho vở tuồng là mô hình nào?',
    options: ['Hề', 'Kép xéo', 'Đào lẵng', 'Nịnh mụt'],
    correctIndex: 0,
    explain: 'Nhân vật hề mang tính chất hài hước, châm biếm, góp phần giảm căng thẳng và phản ánh tiếng nói dân gian.',
  },
]

function LearningPage() {
  const [activeModel, setActiveModel] = useState(CHARACTER_MODELS[0].id)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [activeSectionId, setActiveSectionId] = useState(SECTIONS[0].id)
  const [carouselCenterIndex, setCarouselCenterIndex] = useState(0)
  const [carouselDragging, setCarouselDragging] = useState(false)
  const carouselDragStart = useRef({ x: 0, scrollLeft: 0 })

  const scrollContainerRef = useRef(null)
  const carouselScrollRef = useRef(null)
  const sectionRefs = {
    intro: useRef(null),
    characters: useRef(null),
    practice: useRef(null),
  }

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const handleScroll = () => {
      const sections = SECTIONS.map((s) => ({
        id: s.id,
        top: sectionRefs[s.id].current?.getBoundingClientRect().top ?? 0,
      }))
      const threshold = window.innerHeight * 0.35
      const passed = sections.filter((s) => s.top <= threshold)
      const active = passed.length > 0 ? passed[passed.length - 1] : sections[0]
      setActiveSectionId(active.id)
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    const raf = requestAnimationFrame(handleScroll)
    return () => {
      el.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  /* Auto-play Center Carousel: khung 160x300px, mục giữa full, infinite loop */
  const CAROUSEL_ITEM_WIDTH = 160
  const CAROUSEL_ITEM_HEIGHT = 300
  const CAROUSEL_GAP = 12
  const CAROUSEL_STEP = CAROUSEL_ITEM_WIDTH + CAROUSEL_GAP
  const CAROUSEL_COPIES = 3
  const CAROUSEL_MIDDLE_START = CHARACTER_MODELS.length

  useEffect(() => {
    const el = carouselScrollRef.current
    if (!el) return
    const physicalIndex = CAROUSEL_MIDDLE_START + carouselCenterIndex
    const targetScroll = physicalIndex * CAROUSEL_STEP
    el.scrollTo({ left: targetScroll, behavior: 'smooth' })
  }, [carouselCenterIndex])

  useEffect(() => {
    const el = carouselScrollRef.current
    if (!el) return
    el.scrollLeft = CAROUSEL_MIDDLE_START * CAROUSEL_STEP
  }, [])

  useEffect(() => {
    const el = carouselScrollRef.current
    if (!el) return
    const onScroll = () => {
      if (carouselDragging) return
      const idx = Math.round(el.scrollLeft / CAROUSEL_STEP)
      const logical = ((idx - CAROUSEL_MIDDLE_START) % CHARACTER_MODELS.length + CHARACTER_MODELS.length) % CHARACTER_MODELS.length
      setCarouselCenterIndex(logical)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [carouselDragging])

  useEffect(() => {
    const id = setInterval(() => {
      setCarouselCenterIndex((prev) => (prev + 1) % CHARACTER_MODELS.length)
    }, 3500)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onMove = (e) => {
      if (!carouselDragging || !carouselScrollRef.current) return
      const { x, scrollLeft } = carouselDragStart.current
      const next = scrollLeft + (x - e.clientX)
      carouselScrollRef.current.scrollLeft = Math.max(0, next)
    }
    const onUp = () => setCarouselDragging(false)
    if (carouselDragging) {
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    }
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [carouselDragging])

  const handleCarouselPrev = () => {
    setCarouselCenterIndex((prev) => (prev - 1 + CHARACTER_MODELS.length) % CHARACTER_MODELS.length)
  }

  const handleCarouselNext = () => {
    setCarouselCenterIndex((prev) => (prev + 1) % CHARACTER_MODELS.length)
  }

  const scrollToSection = (id) => {
    sectionRefs[id].current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSelectModel = (id) => {
    setActiveModel(id)
  }

  const handleAnswer = (index) => {
    const question = QUIZ_QUESTIONS[currentQuestion]
    setSelectedOption(index)
    setIsCorrect(index === question.correctIndex)
  }

  const handleNextQuestion = () => {
    setSelectedOption(null)
    setIsCorrect(null)
    setCurrentQuestion((prev) => (prev + 1) % QUIZ_QUESTIONS.length)
  }

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setSelectedOption(null)
      setIsCorrect(null)
      setCurrentQuestion((prev) => prev - 1)
    } else {
      scrollToSection('characters')
    }
  }

  const activeModelData = CHARACTER_MODELS.find((m) => m.id === activeModel)

  return (
    <div className="learning-landing">
      {/* Side nav — dots / labels */}
      <nav className="learning-landing-nav" aria-label="Điều hướng trang học tập">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`learning-nav-dot ${activeSectionId === s.id ? 'active' : ''}`}
            onClick={() => scrollToSection(s.id)}
            aria-current={activeSectionId === s.id ? 'true' : undefined}
            aria-label={`Đến phần ${s.label}`}
            title={s.label}
          >
            <span className="learning-nav-dot-num">{s.short}</span>
            <span className="learning-nav-dot-label">{s.label}</span>
          </button>
        ))}
      </nav>

      <div className="learning-landing-scroll" ref={scrollContainerRef}>
        {/* Phần 1: Hero / Giới thiệu — full viewport */}
        <section
          ref={sectionRefs.intro}
          className="learning-landing-section learning-section-intro"
          id="learning-intro"
        >
          <div className="container learning-section-inner">
            <motion.div
              className="learning-intro"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="learning-intro-badge">Học tập tương tác</div>
              <h2 className="learning-hero-title">Hiểu tuồng qua từng lớp sân khấu</h2>
              <p className="learning-intro-text">
                Tuồng, còn gọi là hát bội, là một loại hình nghệ thuật sân khấu truyền thống lâu đời của Việt Nam. Thông qua hình thức biểu diễn ước lệ, cách điệu cao với hát, múa, động tác và hóa trang đặc trưng, tuồng phản ánh những vấn đề lớn của đời sống xã hội như trung – hiếu – tiết – nghĩa, cái thiện và cái ác. Trải qua nhiều thế kỷ hình thành và phát triển, tuồng đã trở thành một di sản văn hóa đặc sắc, thể hiện bản sắc và tinh thần dân tộc Việt Nam.
              </p>
              <div className="learning-intro-stats">
                <div className="learning-intro-card">
                  <span className="learning-intro-number">7</span>
                  <span className="learning-intro-label">Mô hình nhân vật tiêu biểu</span>
                </div>
                <div className="learning-intro-card">
                  <span className="learning-intro-number">3 phút</span>
                  <span className="learning-intro-label">Để nắm khung kiến thức cơ bản</span>
                </div>
                <div className="learning-intro-card">
                  <span className="learning-intro-number">Tương tác</span>
                  <span className="learning-intro-label">Vừa học, vừa thử, vừa nhớ lâu</span>
                </div>
              </div>
              <button
                type="button"
                className="learning-scroll-cta"
                onClick={() => scrollToSection('characters')}
              >
                Khám phá mô hình nhân vật
                <span className="learning-scroll-cta-arrow" aria-hidden>↓</span>
              </button>
            </motion.div>
          </div>
        </section>

        {/* Phần 2: Mô hình nhân vật — expanding panels */}
        <section
          ref={sectionRefs.characters}
          className="learning-landing-section learning-section-characters"
          id="learning-characters"
        >
          <div className="container learning-section-inner">
            <div className="learning-section-header">
              <h3 className="learning-section-title expanding-panels-title">Các mô hình nhân vật trong tuồng</h3>
            </div>

            <div className="expanding-panels">
              {CHARACTER_MODELS.map((model) => {
                const isExpanded = model.id === activeModel
                return (
                  <motion.button
                    key={model.id}
                    type="button"
                    className={`panel-item ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => handleSelectModel(model.id)}
                    layout
                    transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                  >
                    <div
                      className="panel-bg"
                      style={{ backgroundImage: `url(${encodeURI(model.image)})` }}
                    />
                    {!isExpanded && (
                      <span className="panel-vertical-label">
                        {model.shortLabel?.toUpperCase() ?? model.title}
                      </span>
                    )}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          className="panel-overlay"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className="panel-overlay-content">
                            <span className="panel-badge">
                              <span className="panel-badge-dot" />
                              Mô hình nhân vật
                            </span>
                            <h4 className="panel-overlay-title">{model.title}</h4>
                            <p className="panel-overlay-desc">{model.content}</p>
                            <span className="panel-cta">
                              Đọc tiếp
                              <span className="panel-cta-arrow" aria-hidden>→</span>
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )
              })}
            </div>

            <div className="character-active-info">
              <span className="character-active-label">Đang xem:</span>
              <span className="character-active-name">{activeModelData?.title}</span>
            </div>

            <button
              type="button"
              className="learning-scroll-cta learning-scroll-cta-secondary"
              onClick={() => scrollToSection('practice')}
            >
              Thử sức cùng tuồng
              <span className="learning-scroll-cta-arrow" aria-hidden>↓</span>
            </button>
          </div>
        </section>

        {/* Phần 3: Quiz vui — trái: câu hỏi + đáp án, phải: carousel nhân vật */}
        <section
          ref={sectionRefs.practice}
          className="learning-landing-section learning-section-practice"
          id="learning-practice"
        >
          <div className="container learning-section-inner learning-quiz-section-inner">
            <div className="quiz-vui-header">
              <h2 className="quiz-vui-title">Quiz vui: Hiểu gì về tuồng Việt Nam?</h2>
            </div>

            <div className="learning-quiz-layout quiz-vui-layout">
              {/* Trái: câu hỏi + 4 đáp án */}
              <div className="quiz-vui-left">
                <div className="quiz-vui-challenge">
                  <span className="quiz-vui-challenge-line" aria-hidden />
                  <span className="quiz-vui-challenge-label">Thử thách nhân vật</span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={QUIZ_QUESTIONS[currentQuestion].id}
                    className="quiz-vui-content"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="quiz-vui-question">
                      Câu {currentQuestion + 1}. {QUIZ_QUESTIONS[currentQuestion].question}
                    </p>

                    <div className="quiz-vui-options">
                      {QUIZ_QUESTIONS[currentQuestion].options.map((opt, index) => {
                        const isSelected = selectedOption === index
                        const isCorrectOption = QUIZ_QUESTIONS[currentQuestion].correctIndex === index
                        const showCorrect = selectedOption !== null && isCorrectOption
                        const showSelected = isSelected

                        return (
                          <button
                            key={`${currentQuestion}-${index}`}
                            type="button"
                            className={`quiz-vui-option ${showSelected ? 'selected' : ''} ${
                              showCorrect ? 'correct' : ''
                            } ${selectedOption !== null && isSelected && !isCorrectOption ? 'incorrect' : ''}`}
                            onClick={() => handleAnswer(index)}
                            disabled={selectedOption !== null}
                          >
                            <span className="quiz-vui-option-letter">{String.fromCharCode(65 + index)}</span>
                            <span className="quiz-vui-option-text">{opt}</span>
                            {showCorrect && (
                              <span className="quiz-vui-option-check" aria-label="Đáp án đúng">
                                ✓
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="quiz-vui-nav">
                  <button
                    type="button"
                    className="quiz-vui-btn-back"
                    onClick={handlePrevQuestion}
                    aria-label="Quay lại"
                  >
                    <span className="quiz-vui-btn-arrow" aria-hidden>←</span>
                    Quay lại
                  </button>
                  <button
                    type="button"
                    className="quiz-vui-btn-next"
                    onClick={handleNextQuestion}
                    aria-label="Tiếp theo"
                  >
                    Tiếp theo
                    <span className="quiz-vui-btn-arrow" aria-hidden>→</span>
                  </button>
                </div>
              </div>

              {/* Phải: carousel ngang — tự cuộn chậm, kéo chuột hoặc nút mũi tên, ẩn thanh cuộn */}
              <div className="quiz-vui-right">
                <div className="quiz-vui-carousel-wrap">
                  <button
                    type="button"
                    className="quiz-vui-carousel-arrow quiz-vui-carousel-arrow-prev"
                    onClick={handleCarouselPrev}
                    aria-label="Xem thẻ trước"
                  >
                    <span aria-hidden>‹</span>
                  </button>
                  <div
                    className="quiz-vui-carousel"
                    ref={carouselScrollRef}
                    onMouseDown={(e) => {
                      if (!carouselScrollRef.current) return
                      carouselDragStart.current = {
                        x: e.clientX,
                        scrollLeft: carouselScrollRef.current.scrollLeft,
                      }
                      setCarouselDragging(true)
                    }}
                    role="region"
                    aria-label="Carousel nhân vật tuồng"
                  >
                    <div className="quiz-vui-carousel-track">
                      {Array.from({ length: CAROUSEL_COPIES }, () => CHARACTER_MODELS).flat().map((model, index) => (
                        <div key={`${model.id}-${index}`} className="quiz-vui-card">
                          <div
                            className="quiz-vui-card-bg"
                            style={{ backgroundImage: `url(${encodeURI(model.image)})` }}
                          />
                          <span className="quiz-vui-card-label">{model.shortLabel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="quiz-vui-carousel-arrow quiz-vui-carousel-arrow-next"
                    onClick={handleCarouselNext}
                    aria-label="Xem thẻ sau"
                  >
                    <span aria-hidden>›</span>
                  </button>
                </div>
                <div className="quiz-vui-context">
                  <span className="quiz-vui-context-label">Đang tìm hiểu về</span>
                  <span className="quiz-vui-context-title">Hệ thống nhân vật Tuồng</span>
                </div>
              </div>
            </div>

            {/* Khối giải thích sau khi chọn đáp án */}
            <AnimatePresence>
              {selectedOption !== null && (
                <motion.div
                  className={`quiz-vui-feedback ${isCorrect ? 'correct' : 'incorrect'}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <p>
                    {isCorrect ? 'Chính xác! ' : 'Chưa đúng. '}
                    {QUIZ_QUESTIONS[currentQuestion].explain}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            
          </div>
        </section>
      </div>
    </div>
  )
}

export default LearningPage
