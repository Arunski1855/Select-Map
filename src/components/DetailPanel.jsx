import React, { useState, useEffect, useRef, useCallback, useMemo, Component } from 'react'
import {
  addNote,
  deleteNote,
  subscribeToNotes,
  addScheduleEntry,
  deleteScheduleEntry,
  subscribeToSchedule,
  addSocialMetric,
  subscribeToSocialMetrics,
  deleteSocialMetric,
  addRankingMetric,
  subscribeToRankingMetrics,
  deleteRankingMetric,
  updateRankingMetric,
  subscribeToLinkedEvents,
  subscribeToContractDetails,
  updateContractDetails,
  addContractHistory,
  subscribeToContractHistory,
  updateProgramHistoricals
} from '../firebase'
import ProgramCard from './ProgramCard'

// Error boundary to prevent white-screen crashes
class DetailPanelErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('DetailPanel crash:', error, info)
  }
  componentDidUpdate(prevProps) {
    if (prevProps.programId !== this.props.programId) {
      this.setState({ hasError: false, error: null })
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="detail-panel open" style={{ padding: 20 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Something went wrong loading this program.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); this.props.onClose?.() }}
            style={{ marginTop: 10, padding: '6px 16px', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Region definitions with colors
const REGIONS = {
  'Canada': { color: '#d4002a' },
  'Mid Atlantic': { color: '#005eb8' },
  'South': { color: '#ff6b00' },
  'Midwest': { color: '#7d2d8e' },
  'West': { color: '#00a550' }
}

const LEVEL_COLORS = {
  'Mahomes': '#e31837',
  'Gold': '#c9a84c',
  'Silver': '#8a8d8f',
  'Bronze': '#a0714f',
  'Regional': '#005eb8'
}

// Team colors hex mapping
// adidas Zone Graphic color palette
const TEAM_COLORS_HEX = {
  // Primary Colors
  'Black': '#000000',
  'White': '#FFFFFF',
  'Team Maroon': '#5C1F35',
  'Team Power Red': '#BF0D3E',
  'Team Orange': '#E35205',
  'Team Collegiate Gold': '#CC8A00',
  'Team Gold': '#FFB81C',
  'Bright Yellow': '#FFFF00',
  'Solar Yellow': '#FFF200',
  'Team Solar Green': '#C4D600',
  'Team Kelly Green': '#009639',
  'Team Dark Green': '#00573F',
  'Team Forest Green': '#0D381E',
  // Secondary Colors
  'Teal': '#00857D',
  'Team Shock Blue': '#009FDF',
  'Team Royal Blue': '#0065BD',
  'Team Collegiate Royal': '#002F87',
  'Team Navy Blue': '#001F5B',
  'Team College Purple': '#512D6D',
  'Team Purple': '#6D2077',
  'Team Pink': '#E31C79',
  'Team Light Grey': '#A2AAAD',
  'Dark Grey Heather': '#5C6670',
  'Orange Rush': '#FF6720',
  'Red Rush': '#ED174C',
  'Blue Rush': '#0033A0'
}

function formatPhone(phone) {
  const digits = (phone || '').replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  return phone
}

function DetailPanel({ program: initialProgram, mtZionPrograms, sport, isOpen, onClose, isUserAllowed, user, onEdit, onDelete }) {
  const [activeDetailTab, setActiveDetailTab] = useState('info')
  const [notes, setNotes] = useState([])
  const [schedule, setSchedule] = useState([])
  const [newNote, setNewNote] = useState('')
  const [newGame, setNewGame] = useState({ date: '', opponent: '', result: '', score: '' })
  const [noteLoading, setNoteLoading] = useState(false)

  // Mt. Zion Prep/National toggle
  const [mtZionActiveIdx, setMtZionActiveIdx] = useState(0)
  const hasMtZionToggle = mtZionPrograms && mtZionPrograms.length > 1
  const program = hasMtZionToggle ? mtZionPrograms[mtZionActiveIdx] : initialProgram

  // Reset toggle when a different program is selected
  useEffect(() => {
    setMtZionActiveIdx(0)
  }, [initialProgram?.id])

  // Social metrics state
  const [socialMetrics, setSocialMetrics] = useState([])
  const [newFollowerCount, setNewFollowerCount] = useState('')
  const [metricLoading, setMetricLoading] = useState(false)

  // Ranking metrics state (for tracking ranking changes over time)
  const [rankingMetrics, setRankingMetrics] = useState([])
  const [newNationalRank, setNewNationalRank] = useState('')
  const [newStateRank, setNewStateRank] = useState('')
  const [rankingLoading, setRankingLoading] = useState(false)
  const [editingRankingId, setEditingRankingId] = useState(null)
  const [editRankingForm, setEditRankingForm] = useState({ nationalRank: '', stateRank: '', date: '' })

  // Linked events state
  const [linkedEvents, setLinkedEvents] = useState([])

  // Contract details state (private, auth-gated)
  const [contractDetails, setContractDetails] = useState(null)
  const [contractHistory, setContractHistory] = useState([])
  const [isEditingContract, setIsEditingContract] = useState(false)
  const [contractForm, setContractForm] = useState({
    term: '',
    travelStipend: '',
    productAllotment: '',
    productCoverage: '',
    incentiveStructure: '',
    contractExpiring2026: false
  })
  const [contractLoading, setContractLoading] = useState(false)

  // Bottom sheet drag state
  const [sheetHeight, setSheetHeight] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(0)
  const panelRef = useRef(null)

  // Historicals section state (collapsible by year)
  const [historicalsExpanded, setHistoricalsExpanded] = useState(false)
  const [isEditingHistoricals, setIsEditingHistoricals] = useState(false)
  const [historicalsForm, setHistoricalsForm] = useState({ '2024': '', '2025': '', '2026': '' })
  const [historicalsLoading, setHistoricalsLoading] = useState(false)

  // Program Card state
  const [showProgramCard, setShowProgramCard] = useState(false)

  useEffect(() => {
    if (!program?.id || !sport || sport === 'events') return
    const unsub1 = subscribeToNotes(sport, program.id, setNotes)
    const unsub2 = subscribeToSchedule(sport, program.id, setSchedule)
    const unsub3 = subscribeToSocialMetrics(sport, program.id, setSocialMetrics)
    const unsub4 = subscribeToLinkedEvents(program.id, setLinkedEvents)
    const unsub5 = subscribeToRankingMetrics(sport, program.id, setRankingMetrics)
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5() }
  }, [program?.id, sport])

  // Subscribe to contract details only when user is authorized
  useEffect(() => {
    // Clear stale data first so old program's contract doesn't linger
    setContractDetails(null)
    setContractHistory([])

    if (!program?.id || !sport || sport === 'events' || !isUserAllowed) {
      return
    }
    const unsub1 = subscribeToContractDetails(sport, program.id, setContractDetails)
    const unsub2 = subscribeToContractHistory(sport, program.id, setContractHistory)
    return () => { unsub1(); unsub2() }
  }, [program?.id, sport, isUserAllowed])

  useEffect(() => {
    setActiveDetailTab('info')
    setSheetHeight(null)
    setNotes([])
    setSchedule([])
    setSocialMetrics([])
    setNewFollowerCount('')
    setLinkedEvents([])
    setIsEditingContract(false)
    setContractForm({ term: '', travelStipend: '', productAllotment: '', productCoverage: '', incentiveStructure: '', contractExpiring2026: false })
  }, [program?.id])

  useEffect(() => {
    if (!isOpen) setSheetHeight(null)
  }, [isOpen])

  // Touch drag handlers for mobile bottom sheet
  const handleDragStart = useCallback((e) => {
    if (window.innerWidth > 768) return
    const touch = e.touches?.[0] || e
    dragStartY.current = touch.clientY
    dragStartHeight.current = panelRef.current?.offsetHeight || window.innerHeight * 0.4
    setIsDragging(true)
  }, [])

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return
    const touch = e.touches?.[0] || e
    const deltaY = dragStartY.current - touch.clientY
    const newHeight = Math.min(
      Math.max(dragStartHeight.current + deltaY, 120),
      window.innerHeight * 0.85
    )
    setSheetHeight(newHeight)
  }, [isDragging])

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    const currentHeight = panelRef.current?.offsetHeight || 0
    const viewHeight = window.innerHeight

    if (currentHeight < viewHeight * 0.15) {
      onClose()
    } else if (currentHeight < viewHeight * 0.55) {
      setSheetHeight(viewHeight * 0.4)
    } else {
      setSheetHeight(viewHeight * 0.75)
    }
  }, [isDragging, onClose])

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e) => handleDragMove(e)
    const onEnd = () => handleDragEnd()
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
    return () => {
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  // Compute chart data for Instagram follower growth
  const igMetrics = useMemo(() => socialMetrics.filter(m => m.platform === 'instagram'), [socialMetrics])

  // Compute ranking history data (sorted by date)
  const rankingHistory = useMemo(() => [...rankingMetrics].sort((a, b) => (a.date || '').localeCompare(b.date || '')), [rankingMetrics])

  // Helper to load image and convert to data URL for PDF
  const loadImageAsDataUrl = useCallback((url) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => resolve(null)
      img.src = url
    })
  }, [])

  // Generate individual program PDF report
  const handleExportProgramPDF = useCallback(async () => {
    if (!program) return
    try {
      // Lazy load jsPDF only when user exports
      const jsPDF = (await import('jspdf')).default
      const doc = new jsPDF()
      const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      const sportName = sport === 'football' ? 'Select Football' : 'Select Basketball'
      let yPos = 20

      // Helper to add new page if needed
      const checkPage = (height = 10) => {
        if (yPos + height > 270) {
          doc.addPage()
          yPos = 20
        }
      }

      // Add team logo if available
      if (program.logo) {
        try {
          const logoDataUrl = await loadImageAsDataUrl(program.logo)
          if (logoDataUrl) {
            doc.addImage(logoDataUrl, 'PNG', 165, 12, 30, 30)
          }
        } catch (e) {
          console.warn('Could not load logo for PDF:', e)
        }
      }

      // Header with program name
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text(program.name, 14, yPos)
      yPos += 8

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`${program.city}, ${program.state}`, 14, yPos)
      yPos += 6

      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text(`adidas ${sportName} | ${program.region} Region`, 14, yPos)
      yPos += 4
      doc.text(`Report Generated: ${today}`, 14, yPos)
      doc.setTextColor(0)
      yPos += 12

      // Program Details Section
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Program Details', 14, yPos)
      yPos += 8

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      const details = [
        ['Level', program.level],
        ['Gender', program.gender],
        ['Conference', program.conference],
        ['Head Coach', program.headCoach],
        ['National Ranking', program.ranking],
        ['State Ranking', program.stateRanking],
        ['Team Colors', [program.primaryColor, program.secondaryColor].filter(Boolean).join(' / ')],
        ['Team Type', program.teamType]
      ].filter(([, val]) => val)

      details.forEach(([label, value]) => {
        checkPage()
        doc.setFont('helvetica', 'bold')
        doc.text(`${label}:`, 14, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(String(value), 50, yPos)
        yPos += 6
      })
      yPos += 6

      // Contact Information
      if (program.contactEmail || program.contactPhone || program.headCoach) {
        checkPage(20)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Contact Information', 14, yPos)
        yPos += 8

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')

        if (program.contactEmail) {
          doc.text(`Email: ${program.contactEmail}`, 14, yPos)
          yPos += 6
        }
        if (program.contactPhone) {
          doc.text(`Phone: ${program.contactPhone}`, 14, yPos)
          yPos += 6
        }
        yPos += 6
      }

      // Social Media
      if (program.twitter || program.instagram) {
        checkPage(20)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Social Media', 14, yPos)
        yPos += 8

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')

        if (program.twitter) {
          const twitterHandle = program.twitter.replace(/^@+/, '')
          doc.text(`Twitter: @${twitterHandle}`, 14, yPos)
          yPos += 6
        }
        if (program.instagram) {
          const instagramHandle = program.instagram.replace(/^@+/, '')
          doc.text(`Instagram: @${instagramHandle}`, 14, yPos)
          yPos += 6
        }
        yPos += 6
      }

      // Linked Events
      if (linkedEvents.length > 0) {
        checkPage(20)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text(`Upcoming Events (${linkedEvents.length})`, 14, yPos)
        yPos += 8

        doc.setFontSize(10)
        linkedEvents.forEach((event) => {
          checkPage(8)
          const eventDate = new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          doc.setFont('helvetica', 'normal')
          doc.text(`• ${eventDate} - ${event.name} (${event.city}, ${event.state})`, 14, yPos)
          yPos += 6
        })
        yPos += 4
      }

      // Top Prospects
      if (program.topProspects) {
        checkPage(20)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Top Prospects', 14, yPos)
        yPos += 8

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        const prospects = doc.splitTextToSize(program.topProspects, 180)
        prospects.forEach((line) => {
          checkPage()
          doc.text(line, 14, yPos)
          yPos += 5
        })
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(`adidas ${sportName} - ${program.name}`, 14, 285)
        doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' })
      }

      // Save the PDF
      const filename = `${program.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-report-${new Date().toISOString().split('T')[0]}.pdf`

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile) {
        const pdfBlob = doc.output('blob')
        const blobUrl = URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = filename
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
        alert('PDF ready! Check your Downloads.')
      } else {
        doc.save(filename)
      }
    } catch (err) {
      console.error('PDF export error:', err)
      alert(`Could not generate PDF: ${err.message || 'Unknown error'}`)
    }
  }, [program, sport, linkedEvents, loadImageAsDataUrl])

  if (!isOpen || !program) return null

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!newNote.trim() || !user) return
    setNoteLoading(true)
    try {
      await addNote(sport, program.id, {
        text: newNote.trim(),
        author: user.email,
        timestamp: Date.now()
      })
      setNewNote('')
    } catch (err) {
      console.error('Error adding note:', err)
    } finally {
      setNoteLoading(false)
    }
  }

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteNote(sport, program.id, noteId)
    } catch (err) {
      console.error('Error deleting note:', err)
    }
  }

  const handleAddMetric = async (e) => {
    e.preventDefault()
    const count = parseInt(newFollowerCount, 10)
    if (!count || count < 0 || !user) return
    setMetricLoading(true)
    try {
      await addSocialMetric(sport, program.id, {
        platform: 'instagram',
        followers: count,
        date: new Date().toISOString().split('T')[0],
        addedBy: user.email,
        timestamp: Date.now()
      })
      setNewFollowerCount('')
    } catch (err) {
      console.error('Error adding metric:', err)
    } finally {
      setMetricLoading(false)
    }
  }

  const handleDeleteMetric = async (metricId) => {
    try {
      await deleteSocialMetric(sport, program.id, metricId)
    } catch (err) {
      console.error('Error deleting metric:', err)
    }
  }

  // Ranking metrics handlers
  const handleAddRankingMetric = async (e) => {
    e.preventDefault()
    if ((!newNationalRank && !newStateRank) || !user) return
    setRankingLoading(true)
    try {
      await addRankingMetric(sport, program.id, {
        nationalRank: newNationalRank || null,
        stateRank: newStateRank || null,
        date: new Date().toISOString().split('T')[0],
        addedBy: user.email,
        timestamp: Date.now()
      })
      setNewNationalRank('')
      setNewStateRank('')
    } catch (err) {
      console.error('Error adding ranking metric:', err)
    } finally {
      setRankingLoading(false)
    }
  }

  const handleDeleteRankingMetric = async (metricId) => {
    try {
      await deleteRankingMetric(sport, program.id, metricId)
    } catch (err) {
      console.error('Error deleting ranking metric:', err)
    }
  }

  const handleEditRankingMetric = (metric) => {
    setEditingRankingId(metric.id)
    setEditRankingForm({
      nationalRank: metric.nationalRank || '',
      stateRank: metric.stateRank || '',
      date: metric.date || ''
    })
  }

  const handleCancelEditRanking = () => {
    setEditingRankingId(null)
    setEditRankingForm({ nationalRank: '', stateRank: '', date: '' })
  }

  const handleSaveRankingMetric = async () => {
    if (!editingRankingId) return
    setRankingLoading(true)
    try {
      await updateRankingMetric(sport, program.id, editingRankingId, {
        nationalRank: editRankingForm.nationalRank || null,
        stateRank: editRankingForm.stateRank || null,
        date: editRankingForm.date,
        updatedBy: user?.email,
        updatedAt: Date.now()
      })
      setEditingRankingId(null)
      setEditRankingForm({ nationalRank: '', stateRank: '', date: '' })
    } catch (err) {
      console.error('Error updating ranking metric:', err)
    } finally {
      setRankingLoading(false)
    }
  }

  // Contract detail handlers
  const handleEditContract = () => {
    setContractForm({
      term: contractDetails?.term || '',
      travelStipend: contractDetails?.travelStipend || '',
      productAllotment: contractDetails?.productAllotment || '',
      productCoverage: contractDetails?.productCoverage || '',
      incentiveStructure: contractDetails?.incentiveStructure || '',
      contractExpiring2026: contractDetails?.contractExpiring2026 || false
    })
    setIsEditingContract(true)
  }

  const handleCancelContractEdit = () => {
    setIsEditingContract(false)
    setContractForm({ term: '', travelStipend: '', productAllotment: '', productCoverage: '', incentiveStructure: '', contractExpiring2026: false })
  }

  const handleSaveContract = async (e) => {
    e.preventDefault()
    if (!user) return
    setContractLoading(true)
    try {
      const oldDetails = contractDetails || {}
      await updateContractDetails(sport, program.id, contractForm, user.email)

      // Log the change to contract history
      const changes = []
      if (contractForm.term !== (oldDetails.term || '')) changes.push(`Term: "${oldDetails.term || '(empty)'}" → "${contractForm.term || '(empty)'}"`)
      if (contractForm.travelStipend !== (oldDetails.travelStipend || '')) changes.push(`Travel Stipend: "${oldDetails.travelStipend || '(empty)'}" → "${contractForm.travelStipend || '(empty)'}"`)
      if (contractForm.productAllotment !== (oldDetails.productAllotment || '')) changes.push(`Product Allotment: "${oldDetails.productAllotment || '(empty)'}" → "${contractForm.productAllotment || '(empty)'}"`)
      if (contractForm.productCoverage !== (oldDetails.productCoverage || '')) changes.push(`Product Coverage: "${oldDetails.productCoverage || '(none)'}" → "${contractForm.productCoverage || '(none)'}"`)
      if (contractForm.incentiveStructure !== (oldDetails.incentiveStructure || '')) changes.push(`Incentive Structure: "${oldDetails.incentiveStructure || '(empty)'}" → "${contractForm.incentiveStructure || '(empty)'}"`)
      if (contractForm.contractExpiring2026 !== (oldDetails.contractExpiring2026 || false)) changes.push(`Expiring 2026: ${oldDetails.contractExpiring2026 ? 'Yes' : 'No'} → ${contractForm.contractExpiring2026 ? 'Yes' : 'No'}`)

      if (changes.length > 0) {
        await addContractHistory(sport, program.id, 'updated', user.email, { changes })
      }

      setIsEditingContract(false)
    } catch (err) {
      console.error('Error saving contract:', err)
      alert('Failed to save contract details. Please try again.')
    } finally {
      setContractLoading(false)
    }
  }

  // Historicals handlers
  const handleEditHistoricals = () => {
    setHistoricalsForm({
      '2024': program?.historicals?.['2024'] || '',
      '2025': program?.historicals?.['2025'] || '',
      '2026': program?.historicals?.['2026'] || ''
    })
    setIsEditingHistoricals(true)
    setHistoricalsExpanded(true)
  }

  const handleCancelHistoricals = () => {
    setIsEditingHistoricals(false)
    setHistoricalsForm({ '2024': '', '2025': '', '2026': '' })
  }

  const handleSaveHistoricals = async () => {
    if (!user) return
    setHistoricalsLoading(true)
    try {
      await updateProgramHistoricals(sport, program.id, historicalsForm)
      setIsEditingHistoricals(false)
    } catch (err) {
      console.error('Error saving historicals:', err)
      alert('Failed to save historicals. Please try again.')
    } finally {
      setHistoricalsLoading(false)
    }
  }

  const regionColor = REGIONS[program.region]?.color || '#333'
  const levelColor = LEVEL_COLORS[program.level] || null
  // School-led moment: use school's primary color for banner (per ADI SEL3CT guidelines)
  const schoolColor = program.primaryColor ? (TEAM_COLORS_HEX[program.primaryColor] || regionColor) : regionColor

  // Auto-detect contract expiry year from term field
  const currentYear = new Date().getFullYear()
  const termYears = contractDetails?.term?.match(/\b(20\d{2})\b/g)?.map(Number) || []
  const termEndYear = termYears.length > 0 ? Math.max(...termYears) : null
  const isContractExpiring = contractDetails?.contractExpiring2026 || termEndYear === currentYear
  const expiringYear = termEndYear === currentYear ? termEndYear : currentYear

  const sheetStyle = sheetHeight ? {
    height: `${sheetHeight}px`,
    maxHeight: `${sheetHeight}px`,
    transition: isDragging ? 'none' : undefined
  } : {}

  const tabs = isUserAllowed
    ? ['info', 'vitals', 'intel', 'contract']
    : ['info', 'vitals', 'intel']

  return (
    <div
      ref={panelRef}
      className={`detail-panel ${isOpen ? 'open' : ''} ${isDragging ? 'dragging' : ''}`}
      style={sheetStyle}
    >
      {/* Banner area - school-led moment uses school primary color */}
      <div className="detail-panel-banner" style={{ background: schoolColor }}>
        <span className="detail-panel-banner-text">{sport === 'football' ? 'Select Football' : 'Select Basketball'}</span>
      </div>

      {/* Drag handle for mobile */}
      <div
        className="detail-panel-handle"
        onTouchStart={handleDragStart}
        onMouseDown={handleDragStart}
      >
        <div className="detail-panel-handle-bar" />
      </div>

      <div className="detail-panel-profile">
        <div className="detail-panel-logo">
          <img src={program.logo} alt={program.name} />
        </div>
        <div className="detail-panel-title">
          <h2>{program.name}</h2>
          <p>{program.city}, {program.state}</p>
          <div className="detail-badges-row">
            <span className="detail-region-badge" style={{ background: regionColor }}>{program.region}</span>
            {program.level && (
              <span className="detail-level-badge" style={{ background: levelColor || '#333' }}>{program.level}</span>
            )}
            {program.gender && program.gender !== 'Boys' && (
              <span className="detail-gender-badge">{program.gender}</span>
            )}
            {program.teamType && (
              <span className="detail-gender-badge" style={{ background: '#1a5c2e' }}>{program.teamType}</span>
            )}
            {program.onboarding2026 && (
              <span className="detail-onboarding-badge">2026</span>
            )}
            {isUserAllowed && isContractExpiring && (
              <span className="detail-expiring-badge">Expiring {expiringYear}</span>
            )}
          </div>
        </div>
        <button className="detail-panel-close" onClick={onClose}>&times;</button>
      </div>

      {hasMtZionToggle && (
        <div className="mtzion-toggle">
          {mtZionPrograms.map((p, idx) => (
            <button
              key={p.id}
              className={`mtzion-toggle-btn ${mtZionActiveIdx === idx ? 'active' : ''}`}
              onClick={() => setMtZionActiveIdx(idx)}
            >
              {p.teamType || (idx === 0 ? 'Prep' : 'National')}
            </button>
          ))}
        </div>
      )}

      <div className="detail-panel-tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`detail-tab ${activeDetailTab === tab ? 'active' : ''}`}
            onClick={() => setActiveDetailTab(tab)}
          >
            {tab === 'info' ? 'Details' : tab === 'vitals' ? 'Vitals' : tab === 'intel' ? 'Intel' : 'Contract'}
          </button>
        ))}
      </div>

      <div className="detail-panel-content">
        {activeDetailTab === 'info' && (
          <div className="detail-info-tab">
            {(program.conference || program.headCoach || program.ranking || program.stateRanking || program.level || program.primaryColor) && (
              <div className="detail-section">
                {program.headCoach && (
                  <div className="detail-row"><span className="detail-label">Head Coach</span><span>{program.headCoach}</span></div>
                )}
                {program.conference && (
                  <div className="detail-row"><span className="detail-label">Conference</span><span>{program.conference}</span></div>
                )}
                {program.ranking && (
                  <div className="detail-row"><span className="detail-label">National Ranking</span><span>{program.ranking}</span></div>
                )}
                {program.stateRanking && (
                  <div className="detail-row"><span className="detail-label">State Ranking</span><span>{program.stateRanking}</span></div>
                )}
                {program.level && (
                  <div className="detail-row"><span className="detail-label">Level</span><span className="detail-level-value" style={{ color: levelColor || 'inherit' }}>{program.level}</span></div>
                )}
                {(program.primaryColor || program.secondaryColor) && (
                  <div className="detail-row">
                    <span className="detail-label">Team Colors</span>
                    <span className="team-colors-display">
                      {program.primaryColor && (
                        <span className="team-color-swatch" style={{ backgroundColor: TEAM_COLORS_HEX[program.primaryColor] || '#ccc' }} title={program.primaryColor}></span>
                      )}
                      {program.secondaryColor && (
                        <span className="team-color-swatch" style={{ backgroundColor: TEAM_COLORS_HEX[program.secondaryColor] || '#ccc' }} title={program.secondaryColor}></span>
                      )}
                      <span className="team-color-names">
                        {[program.primaryColor, program.secondaryColor].filter(Boolean).join(' / ')}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="detail-links-section">
              {program.website && (
                <a href={program.website} target="_blank" rel="noopener noreferrer" className="detail-link-btn">
                  Website
                </a>
              )}
              {program.roster && (
                <a href={program.roster} target="_blank" rel="noopener noreferrer" className="detail-link-btn">
                  Roster
                </a>
              )}
              {program.maxprepsUrl && (
                <a href={program.maxprepsUrl} target="_blank" rel="noopener noreferrer" className="detail-link-btn detail-link-maxpreps">
                  MaxPreps
                </a>
              )}
              {program.maxprepsUrl && (
                <a href={program.maxprepsUrl} target="_blank" rel="noopener noreferrer" className="detail-link-btn detail-link-schedule">
                  Schedule
                </a>
              )}
              {program.tcaStoreUrl && (
                <a href={program.tcaStoreUrl} target="_blank" rel="noopener noreferrer" className="detail-link-btn detail-link-tca">
                  TCA Store
                </a>
              )}
              {program.brandGuide && (
                <a href={program.brandGuide} download={program.brandGuideName || 'brand-guidelines.pdf'} className="detail-link-btn detail-link-brand">
                  Brand Guidelines
                </a>
              )}
            </div>

            {linkedEvents.length > 0 && (
              <div className="linked-events-section">
                <h4 className="detail-section-heading">Linked Events</h4>
                <div className="linked-events-list">
                  {linkedEvents.map(event => (
                    <div key={event.id} className="linked-event-item">
                      <span className="linked-event-date">
                        {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="linked-event-name">{event.name}</span>
                      <span className="linked-event-location">{event.city}, {event.state}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {program.gallery && (Array.isArray(program.gallery) ? program.gallery : Object.values(program.gallery)).length > 0 && (
              <div className="detail-gallery">
                <h4>Gallery</h4>
                <div className="detail-gallery-grid">
                  {(Array.isArray(program.gallery) ? program.gallery : Object.values(program.gallery)).map((img, idx) => (
                    <img key={idx} src={img} alt={`Gallery ${idx + 1}`} className="detail-gallery-img" />
                  ))}
                </div>
              </div>
            )}

            {program.topProspects && (
              <div className="detail-prospects">
                <span className="detail-label">Top Prospects</span>
                <p className="detail-prospects-text">{program.topProspects}</p>
              </div>
            )}

            <div className="detail-actions">
              {isUserAllowed && (
                <>
                  <button className="detail-edit-btn" onClick={() => onEdit(program)}>Edit Program</button>
                  <button className="detail-delete-btn" onClick={() => onDelete(program.id)}>Remove</button>
                </>
              )}
              <button className="detail-export-btn" onClick={handleExportProgramPDF}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                  <path d="M4 2h8l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
                  <polyline points="12,2 12,6 16,6"/>
                </svg>
                Team Report
              </button>
              <button className="detail-export-btn" onClick={() => setShowProgramCard(true)} style={{ background: 'var(--adi-magenta)', color: 'white' }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                  <rect x="3" y="3" width="14" height="14" rx="0"/>
                  <line x1="8" y1="3" x2="8" y2="17"/>
                  <line x1="3" y1="8" x2="17" y2="8"/>
                </svg>
                Program Card
              </button>
            </div>
          </div>
        )}

        {activeDetailTab === 'vitals' && (
          <div className="detail-vitals-tab">
            {(program.contactEmail || program.contactPhone || program.headCoach) ? (
              <div className="detail-section">
                {program.headCoach && (
                  <div className="detail-row"><span className="detail-label">Head Coach</span><span>{program.headCoach}</span></div>
                )}
                {program.contactEmail && (
                  <div className="detail-row">
                    <span className="detail-label">Email</span>
                    <a href={`mailto:${program.contactEmail}`} className="detail-contact-link">{program.contactEmail}</a>
                  </div>
                )}
                {program.contactPhone && (
                  <div className="detail-row">
                    <span className="detail-label">Phone</span>
                    <a href={`tel:${program.contactPhone}`} className="detail-contact-link">{formatPhone(program.contactPhone)}</a>
                  </div>
                )}
              </div>
            ) : (
              <p className="detail-empty">No contact information added yet.</p>
            )}

            {(program.twitter || program.instagram || program.tcaStoreUrl) && (
              <div className="detail-social-section">
                <h4 className="detail-section-heading">Social Media</h4>
                <div className="detail-social-links">
                  {program.twitter && (
                    <a
                      href={`https://twitter.com/${program.twitter.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="detail-social-btn detail-social-twitter"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      {program.twitter}
                    </a>
                  )}
                  {program.instagram && (
                    <a
                      href={`https://instagram.com/${program.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="detail-social-btn detail-social-instagram"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                      {program.instagram}
                    </a>
                  )}
                  {program.tcaStoreUrl && (
                    <a
                      href={program.tcaStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="detail-social-btn detail-social-tca"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
                      TCA Store
                    </a>
                  )}
                </div>
              </div>
            )}

            {program.website && (
              <div className="detail-social-section">
                <h4 className="detail-section-heading">Website</h4>
                <a href={program.website} target="_blank" rel="noopener noreferrer" className="detail-link-btn" style={{ display: 'inline-block' }}>
                  Visit Website
                </a>
              </div>
            )}

            {/* Instagram Follower Growth Tracking */}
            {program.instagram && (
              <div className="detail-social-section">
                <h4 className="detail-section-heading">Instagram Growth</h4>

                {igMetrics.length >= 2 && (() => {
                  try {
                  const minF = Math.min(...igMetrics.map(m => m.followers || 0))
                  const maxF = Math.max(...igMetrics.map(m => m.followers || 0))
                  const range = maxF - minF || 1
                  const chartW = 280
                  const chartH = 100
                  const padL = 0
                  const padR = 0
                  const padT = 8
                  const padB = 20
                  const plotW = chartW - padL - padR
                  const plotH = chartH - padT - padB
                  const points = igMetrics.map((m, i) => {
                    const x = padL + (i / (igMetrics.length - 1)) * plotW
                    const y = padT + plotH - ((m.followers - minF) / range) * plotH
                    return { x, y, ...m }
                  })
                  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')
                  const areaPath = `M${points[0].x},${padT + plotH} ${points.map(p => `L${p.x},${p.y}`).join(' ')} L${points[points.length - 1].x},${padT + plotH} Z`
                  const first = igMetrics[0].followers
                  const last = igMetrics[igMetrics.length - 1].followers
                  const growth = last - first
                  const growthPct = first > 0 ? ((growth / first) * 100).toFixed(1) : 0

                  return (
                    <div className="ig-growth-chart">
                      <div className="ig-growth-summary">
                        <span className="ig-growth-current">{last.toLocaleString()}</span>
                        <span className={`ig-growth-delta ${growth >= 0 ? 'positive' : 'negative'}`}>
                          {growth >= 0 ? '+' : ''}{growth.toLocaleString()} ({growthPct}%)
                        </span>
                      </div>
                      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="ig-growth-svg">
                        <defs>
                          <linearGradient id="igGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#E1306C" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#E1306C" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>
                        <path d={areaPath} fill="url(#igGrad)" />
                        <polyline points={polyline} fill="none" stroke="#E1306C" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                        {points.map((p, i) => (
                          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#E1306C" stroke="#fff" strokeWidth="1.5" />
                        ))}
                        {/* X-axis labels */}
                        {points.filter((_, i) => i === 0 || i === points.length - 1 || igMetrics.length <= 6).map((p, i) => (
                          <text key={i} x={p.x} y={chartH - 2} textAnchor="middle" fontSize="7" fill="var(--text-muted)">{new Date(p.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</text>
                        ))}
                      </svg>
                    </div>
                  )
                  } catch (e) { console.error('Chart render error:', e); return null }
                })()}

                {igMetrics.length === 1 && (
                  <div className="ig-growth-single">
                    <span className="ig-growth-current">{igMetrics[0].followers.toLocaleString()}</span>
                    <span className="ig-growth-date">as of {new Date(igMetrics[0].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                )}

                {igMetrics.length === 0 && (
                  <p className="detail-empty" style={{ marginBottom: 8 }}>No follower data recorded yet.</p>
                )}

                {/* Snapshot history */}
                {igMetrics.length > 0 && (
                  <div className="ig-history">
                    {igMetrics.slice().reverse().slice(0, 5).map(m => (
                      <div key={m.id} className="ig-history-row">
                        <span className="ig-history-date">{new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="ig-history-count">{m.followers.toLocaleString()}</span>
                        {isUserAllowed && (
                          <button className="ig-history-delete" onClick={() => handleDeleteMetric(m.id)}>&times;</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add snapshot form */}
                {isUserAllowed && (
                  <form className="ig-snapshot-form" onSubmit={handleAddMetric}>
                    <input
                      type="number"
                      value={newFollowerCount}
                      onChange={e => setNewFollowerCount(e.target.value)}
                      placeholder="Current follower count"
                      min="0"
                      className="ig-snapshot-input"
                    />
                    <button type="submit" disabled={metricLoading || !newFollowerCount} className="ig-snapshot-btn">
                      {metricLoading ? '...' : 'Log'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Ranking History Tracking */}
            {isUserAllowed && (
              <div className="detail-social-section">
                <h4 className="detail-section-heading">Ranking History</h4>

                {rankingHistory.length >= 2 && (() => {
                  try {
                    // Parse rankings to numeric values for charting (lower is better)
                    const parseRank = (r) => {
                      if (!r || r === 'Unranked') return 26
                      const match = r.match(/#?(\d+)/)
                      return match ? parseInt(match[1], 10) : 26
                    }

                    const nationalData = rankingHistory.filter(m => m.nationalRank).map(m => ({ ...m, rank: parseRank(m.nationalRank) }))
                    const stateData = rankingHistory.filter(m => m.stateRank).map(m => ({ ...m, rank: parseRank(m.stateRank) }))

                    // Use national data for chart if available, otherwise state
                    const chartData = nationalData.length >= 2 ? nationalData : stateData

                    if (chartData.length >= 2) {
                      const minR = Math.min(...chartData.map(m => m.rank))
                      const maxR = Math.max(...chartData.map(m => m.rank))
                      const range = maxR - minR || 1
                      const chartW = 280
                      const chartH = 100
                      const padL = 0
                      const padR = 0
                      const padT = 8
                      const padB = 20
                      const plotW = chartW - padL - padR
                      const plotH = chartH - padT - padB
                      const points = chartData.map((m, i) => {
                        const x = padL + (i / (chartData.length - 1)) * plotW
                        // Invert Y because lower rank is better (should be higher on chart)
                        const y = padT + ((m.rank - minR) / range) * plotH
                        return { x, y, ...m }
                      })
                      const polyline = points.map(p => `${p.x},${p.y}`).join(' ')
                      const areaPath = `M${points[0].x},${padT + plotH} ${points.map(p => `L${p.x},${p.y}`).join(' ')} L${points[points.length - 1].x},${padT + plotH} Z`
                      const first = chartData[0].rank
                      const last = chartData[chartData.length - 1].rank
                      const improvement = first - last // positive means improved (lower rank)

                      return (
                        <div className="ranking-growth-chart">
                          <div className="ranking-growth-summary">
                            <span className="ranking-growth-current">{nationalData.length >= 2 ? 'National: ' : 'State: '}{last <= 25 ? `#${last}` : 'Unranked'}</span>
                            <span className={`ranking-growth-delta ${improvement >= 0 ? 'positive' : 'negative'}`}>
                              {improvement > 0 ? `+${improvement} spots` : improvement < 0 ? `${improvement} spots` : 'No change'}
                            </span>
                          </div>
                          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="ranking-growth-svg">
                            <defs>
                              <linearGradient id="rankGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#005eb8" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#005eb8" stopOpacity="0.02" />
                              </linearGradient>
                            </defs>
                            <path d={areaPath} fill="url(#rankGrad)" />
                            <polyline points={polyline} fill="none" stroke="#005eb8" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                            {points.map((p, i) => (
                              <circle key={i} cx={p.x} cy={p.y} r="3" fill="#005eb8" stroke="#fff" strokeWidth="1.5" />
                            ))}
                            {points.filter((_, i) => i === 0 || i === points.length - 1 || chartData.length <= 6).map((p, i) => (
                              <text key={i} x={p.x} y={chartH - 2} textAnchor="middle" fontSize="7" fill="var(--text-muted)">{new Date(p.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</text>
                            ))}
                          </svg>
                        </div>
                      )
                    }
                    return null
                  } catch (e) { console.error('Ranking chart render error:', e); return null }
                })()}

                {rankingHistory.length === 1 && (
                  <div className="ranking-growth-single">
                    <span className="ranking-growth-current">
                      {rankingHistory[0].nationalRank && `National: ${rankingHistory[0].nationalRank}`}
                      {rankingHistory[0].nationalRank && rankingHistory[0].stateRank && ' | '}
                      {rankingHistory[0].stateRank && `State: ${rankingHistory[0].stateRank}`}
                    </span>
                    <span className="ranking-growth-date">as of {new Date(rankingHistory[0].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                )}

                {rankingHistory.length === 0 && (
                  <p className="detail-empty" style={{ marginBottom: 8 }}>No ranking history recorded yet.</p>
                )}

                {/* Ranking history list */}
                {rankingHistory.length > 0 && (
                  <div className="ranking-history">
                    {rankingHistory.slice().reverse().slice(0, 5).map(m => (
                      <div key={m.id} className="ranking-history-row">
                        {editingRankingId === m.id ? (
                          <>
                            <input
                              type="date"
                              value={editRankingForm.date}
                              onChange={e => setEditRankingForm(f => ({ ...f, date: e.target.value }))}
                              className="ranking-edit-date"
                            />
                            <input
                              type="text"
                              value={editRankingForm.nationalRank}
                              onChange={e => setEditRankingForm(f => ({ ...f, nationalRank: e.target.value }))}
                              placeholder="National"
                              className="ranking-edit-input"
                            />
                            <input
                              type="text"
                              value={editRankingForm.stateRank}
                              onChange={e => setEditRankingForm(f => ({ ...f, stateRank: e.target.value }))}
                              placeholder="State"
                              className="ranking-edit-input"
                            />
                            <button className="ranking-edit-save" onClick={handleSaveRankingMetric} disabled={rankingLoading}>Save</button>
                            <button className="ranking-edit-cancel" onClick={handleCancelEditRanking}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <span className="ranking-history-date">{new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span className="ranking-history-values">
                              {m.nationalRank && <span className="ranking-badge national">N: {m.nationalRank}</span>}
                              {m.stateRank && <span className="ranking-badge state">S: {m.stateRank}</span>}
                            </span>
                            <button className="ranking-history-edit" onClick={() => handleEditRankingMetric(m)} title="Edit">&#9998;</button>
                            <button className="ranking-history-delete" onClick={() => handleDeleteRankingMetric(m.id)} title="Delete">&times;</button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add ranking snapshot form */}
                <form className="ranking-snapshot-form" onSubmit={handleAddRankingMetric}>
                  <div className="ranking-inputs">
                    <input
                      type="text"
                      value={newNationalRank}
                      onChange={e => setNewNationalRank(e.target.value)}
                      className="ranking-snapshot-input"
                      placeholder="National (e.g. #42)"
                    />
                    <input
                      type="text"
                      value={newStateRank}
                      onChange={e => setNewStateRank(e.target.value)}
                      className="ranking-snapshot-input"
                      placeholder="State (e.g. #5)"
                    />
                  </div>
                  <button type="submit" disabled={rankingLoading || (!newNationalRank && !newStateRank)} className="ranking-snapshot-btn">
                    {rankingLoading ? '...' : 'Log'}
                  </button>
                </form>
              </div>
            )}

            {/* Historicals Section - Collapsible by year */}
            <div className="detail-social-section historicals-section">
              <div className="historicals-header">
                <button
                  type="button"
                  className="historicals-toggle"
                  onClick={() => setHistoricalsExpanded(!historicalsExpanded)}
                >
                  <h4 className="detail-section-heading" style={{ margin: 0 }}>Historicals</h4>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ transform: historicalsExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {isUserAllowed && !isEditingHistoricals && (
                  <button className="historicals-edit-btn" onClick={handleEditHistoricals} title="Edit">
                    &#9998;
                  </button>
                )}
              </div>

              {historicalsExpanded && (
                <div className="historicals-content">
                  {isEditingHistoricals ? (
                    <div className="historicals-edit-form">
                      {['2026', '2025', '2024'].map(year => (
                        <div key={year} className="historicals-edit-row">
                          <label className="historicals-year">{year}</label>
                          <input
                            type="text"
                            value={historicalsForm[year]}
                            onChange={e => setHistoricalsForm(prev => ({ ...prev, [year]: e.target.value }))}
                            placeholder="e.g., State Champions, Final Four, 25-5 record"
                            className="historicals-input"
                          />
                        </div>
                      ))}
                      <div className="historicals-actions">
                        <button className="historicals-cancel-btn" onClick={handleCancelHistoricals} disabled={historicalsLoading}>
                          Cancel
                        </button>
                        <button className="historicals-save-btn" onClick={handleSaveHistoricals} disabled={historicalsLoading}>
                          {historicalsLoading ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {['2026', '2025', '2024'].map(year => (
                        <div key={year} className="historicals-year-row">
                          <span className="historicals-year">{year}</span>
                          <span className="historicals-data">
                            {program?.historicals?.[year] || '—'}
                          </span>
                        </div>
                      ))}
                      {!program?.historicals && (
                        <p className="detail-empty" style={{ fontSize: '12px', marginTop: '8px' }}>
                          No historical data recorded yet.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeDetailTab === 'intel' && (
          <div className="detail-intel-tab">
            {!isUserAllowed ? (
              <p className="detail-empty">Sign in to view internal notes.</p>
            ) : (
              <>
                <form className="add-note-form" onSubmit={handleAddNote}>
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Add an internal note..."
                    rows={3}
                  />
                  <button type="submit" disabled={noteLoading || !newNote.trim()}>
                    {noteLoading ? 'Adding...' : 'Add Note'}
                  </button>
                </form>

                {notes.length === 0 ? (
                  <p className="detail-empty">No notes yet.</p>
                ) : (
                  <div className="notes-list">
                    {notes.map(note => (
                      <div key={note.id} className="note-item">
                        <div className="note-header">
                          <span className="note-author">{note.author}</span>
                          <span className="note-time">{new Date(note.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                        </div>
                        <p className="note-text">{note.text}</p>
                        <button className="note-delete" onClick={() => handleDeleteNote(note.id)}>&times;</button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeDetailTab === 'contract' && isUserAllowed && (
          <div className="detail-contract-tab">
            <div className="contract-warning">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Private contract details - authorized users only</span>
            </div>

            {isEditingContract ? (
              <form className="contract-edit-form" onSubmit={handleSaveContract}>
                <div className="contract-field">
                  <label htmlFor="contract-term">Term (Contract Length)</label>
                  <input
                    id="contract-term"
                    type="text"
                    value={contractForm.term}
                    onChange={e => setContractForm(prev => ({ ...prev, term: e.target.value }))}
                    placeholder="e.g., 3 years, 2024-2027"
                  />
                </div>
                <div className="contract-field">
                  <label htmlFor="contract-travel">Travel Stipend</label>
                  <input
                    id="contract-travel"
                    type="text"
                    value={contractForm.travelStipend}
                    onChange={e => setContractForm(prev => ({ ...prev, travelStipend: e.target.value }))}
                    placeholder="e.g., $5,000 annual"
                  />
                </div>
                <div className="contract-field">
                  <label htmlFor="contract-product">Product Allotment</label>
                  <input
                    id="contract-product"
                    type="text"
                    value={contractForm.productAllotment}
                    onChange={e => setContractForm(prev => ({ ...prev, productAllotment: e.target.value }))}
                    placeholder="e.g., $50,000/year"
                  />
                </div>
                <div className="contract-field">
                  <label>Product Coverage</label>
                  <div className="contract-coverage-toggle">
                    <button
                      type="button"
                      className={`coverage-btn coverage-btn-team${contractForm.productCoverage === 'TEAM' ? ' active' : ''}`}
                      onClick={() => setContractForm(prev => ({ ...prev, productCoverage: prev.productCoverage === 'TEAM' ? '' : 'TEAM' }))}
                    >
                      TEAM
                    </button>
                    <button
                      type="button"
                      className={`coverage-btn coverage-btn-spoma${contractForm.productCoverage === 'SPOMA' ? ' active' : ''}`}
                      onClick={() => setContractForm(prev => ({ ...prev, productCoverage: prev.productCoverage === 'SPOMA' ? '' : 'SPOMA' }))}
                    >
                      SPOMA
                    </button>
                  </div>
                </div>
                <div className="contract-field">
                  <label htmlFor="contract-incentive">Incentive Structure</label>
                  <textarea
                    id="contract-incentive"
                    value={contractForm.incentiveStructure}
                    onChange={e => setContractForm(prev => ({ ...prev, incentiveStructure: e.target.value }))}
                    placeholder="e.g., Championship bonus: $10k, Playoff appearance: $5k"
                    rows={3}
                  />
                </div>
                <div className="contract-field contract-field-checkbox">
                  <label className="contract-checkbox-label">
                    <input
                      type="checkbox"
                      checked={contractForm.contractExpiring2026}
                      onChange={e => setContractForm(prev => ({ ...prev, contractExpiring2026: e.target.checked }))}
                    />
                    <span>Flag as expiring this year <span className="contract-checkbox-hint">(auto-detected if term includes {currentYear})</span></span>
                  </label>
                </div>
                <div className="contract-form-actions">
                  <button type="button" className="contract-cancel-btn" onClick={handleCancelContractEdit} disabled={contractLoading}>
                    Cancel
                  </button>
                  <button type="submit" className="contract-save-btn" disabled={contractLoading}>
                    {contractLoading ? 'Saving...' : 'Save Contract Details'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="contract-display">
                {contractDetails ? (
                  <div className="contract-details">
                    <div className="contract-row">
                      <span className="contract-label">Term</span>
                      <span className="contract-value">{contractDetails.term || '—'}</span>
                    </div>
                    <div className="contract-row">
                      <span className="contract-label">Travel Stipend</span>
                      <span className="contract-value">{contractDetails.travelStipend || '—'}</span>
                    </div>
                    <div className="contract-row">
                      <span className="contract-label">Product Allotment</span>
                      <span className="contract-value">{contractDetails.productAllotment || '—'}</span>
                    </div>
                    <div className="contract-row">
                      <span className="contract-label">Product Coverage</span>
                      <span className="contract-value">
                        {contractDetails.productCoverage ? (
                          <span className={`coverage-badge coverage-badge-${contractDetails.productCoverage.toLowerCase()}`}>
                            {contractDetails.productCoverage}
                          </span>
                        ) : '—'}
                      </span>
                    </div>
                    <div className="contract-row">
                      <span className="contract-label">Incentive Structure</span>
                      <span className="contract-value contract-value-multiline">{contractDetails.incentiveStructure || '—'}</span>
                    </div>
                    {contractDetails.lastUpdated && (
                      <div className="contract-meta">
                        Last updated {new Date(contractDetails.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} by {contractDetails.updatedBy}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="detail-empty">No contract details added yet.</p>
                )}
                <button className="contract-edit-btn" onClick={handleEditContract}>
                  {contractDetails ? 'Edit Contract Details' : 'Add Contract Details'}
                </button>
              </div>
            )}

            {/* Contract History */}
            {contractHistory.length > 0 && (
              <div className="contract-history">
                <h4 className="contract-history-heading">Change History</h4>
                <div className="contract-history-list">
                  {contractHistory.slice(0, 10).map(entry => (
                    <div key={entry.id} className="contract-history-item">
                      <div className="contract-history-header">
                        <span className="contract-history-user">{entry.userEmail}</span>
                        <span className="contract-history-time">
                          {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                      {entry.details?.changes && (
                        <ul className="contract-history-changes">
                          {entry.details.changes.map((change, idx) => (
                            <li key={idx}>{change}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Program Card Modal */}
      {showProgramCard && (
        <ProgramCard
          program={program}
          sport={sport}
          onClose={() => setShowProgramCard(false)}
        />
      )}
    </div>
  )
}

function DetailPanelWithBoundary(props) {
  return (
    <DetailPanelErrorBoundary programId={props.program?.id} onClose={props.onClose}>
      <DetailPanel {...props} />
    </DetailPanelErrorBoundary>
  )
}

export default DetailPanelWithBoundary
