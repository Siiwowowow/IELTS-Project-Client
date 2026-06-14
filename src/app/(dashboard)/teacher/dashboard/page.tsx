'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { readingService } from '@/services/reading.services'
import { toast } from 'sonner'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  IconBook2, 
  IconPlus, 
  IconFileText, 
  IconPhoto, 
  IconTrash, 
  IconCheck, 
  IconAlertCircle,
  IconArrowRight,
  IconSparkles,
  IconCircleCheck,
  IconCloudUpload,
  IconNotebook,
  IconInfoCircle,
  IconLoader2,
  IconTable,
  IconBold
} from '@tabler/icons-react'

// Tab definitions for IELTS modules
const modules = [
  { id: 'reading', label: 'Reading Exam Builder', icon: IconBook2, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  { id: 'listening', label: 'Listening Builder', icon: IconBook2, color: 'text-violet-500 bg-violet-50/50 border-violet-100/50' },
  { id: 'writing', label: 'Writing Builder', icon: IconBook2, color: 'text-amber-500 bg-amber-50/50 border-amber-100/50' },
  { id: 'speaking', label: 'Speaking Builder', icon: IconBook2, color: 'text-rose-500 bg-rose-50/50 border-rose-100/50' },
]

// All Official IELTS Reading Question Types
const readingQuestionTypes = [
  { code: "R-MCQ", title: "Multiple Choice Questions (MCQ)", desc: "Select correct answers from list options.", type: "MULTIPLE_CHOICE" },
  { code: "R-TFN", title: "True / False / Not Given", desc: "Identify if statements agree with factual passage details.", type: "TRUE_FALSE_NOT_GIVEN" },
  { code: "R-YNN", title: "Yes / No / Not Given", desc: "Identify if statements agree with the writer's opinions/views.", type: "YES_NO_NOT_GIVEN" },
  { code: "R-MHDG", title: "Matching Headings", desc: "Match headers from a list to paragraph or section letters.", type: "MATCHING_HEADINGS" },
  { code: "R-MINF", title: "Matching Information", desc: "Decide which paragraph/section contains specific details.", type: "MATCHING_INFORMATION" },
  { code: "R-MFT", title: "Matching Features", desc: "Match options/names with details or findings.", type: "MATCHING_FEATURES" },
  { code: "R-MSE", title: "Matching Sentence Endings", desc: "Complete sentences by matching with correct endings.", type: "MATCHING_SENTENCE_ENDINGS" },
  { code: "R-SCOMP", title: "Sentence Completion", desc: "Fill in blanks at the end of sentences.", type: "SENTENCE_COMPLETION" },
  { code: "R-SCO", title: "Summary Completion (With Options)", desc: "Complete summary using words from a provided options list.", type: "SUMMARY_COMPLETION_WITH_OPTIONS" },
  { code: "R-SCWO", title: "Summary Completion (Without Options)", desc: "Complete summary using direct words from the text.", type: "SUMMARY_COMPLETION_WITHOUT_OPTIONS" },
  { code: "R-NCOMP", title: "Notes Completion", desc: "Complete a notes outline with missing words.", type: "NOTES_COMPLETION" },
  { code: "R-TABLE", title: "Table Completion", desc: "Complete table cells with matching words/phrases.", type: "TABLE_COMPLETION" },
  { code: "R-FLOW", title: "Flow Chart Completion", desc: "Label stages of a sequence in a flowchart.", type: "FLOW_CHART_COMPLETION" },
  { code: "R-DIAG", title: "Diagram Label Completion", desc: "Label parts of a diagram or illustration.", type: "DIAGRAM_LABELLING" },
  { code: "R-SAQ", title: "Short Answer Questions", desc: "Answer comprehension questions in a few words.", type: "SHORT_ANSWER" }
]

interface QuestionItem {
  id: string
  passageIndex: number // 1, 2, or 3
  type: string
  typeCode: string
  questionNumber: number
  text: string
  instruction: string
  correctAnswer: string
  explanation?: string
  options?: string[]
  groupOptions?: string[]
  passageSegment?: string
  groupImageUrl?: string
}

interface PassageData {
  title: string
  body: string
  instruction?: string
  pdf: { name: string; size: string; url: string } | null
  image: string | null
  imageName: string
}

interface VisualTableBuilderProps {
  value: string
  onChange: (val: string) => void
}

function VisualTableBuilder({ value, onChange }: VisualTableBuilderProps) {
  const initialGrid = React.useMemo(() => {
    if (!value.trim()) {
      return [
        ["Header 1", "Header 2", "Header 3"],
        ["Text Details", "Restored in [7]", "Steps [8]"],
        ["Row 2 Col 1", "Row 2 Col 2", "Row 2 Col 3"]
      ]
    }
    const lines = value.trim().split("\n")
    const grid: string[][] = []
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const cells = trimmed
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim())
        const isSeparator = cells.every((cell) => /^[-:\s]+$/.test(cell))
        if (!isSeparator) {
          grid.push(cells)
        }
      }
    }
    if (grid.length === 0) {
      return [["Header 1"], [""]]
    }
    return grid
  }, [value])

  const [grid, setGrid] = useState<string[][]>(initialGrid)
  const [isRaw, setIsRaw] = useState(false)

  useEffect(() => {
    setGrid(initialGrid)
  }, [initialGrid])

  const updateMarkdown = (newGrid: string[][]) => {
    if (newGrid.length === 0) {
      onChange("")
      return
    }
    const headers = newGrid[0]
    const separator = headers.map(() => "---")
    const rows = newGrid.slice(1)
    
    const mdLines = [
      `| ${headers.join(" | ")} |`,
      `| ${separator.join(" | ")} |`,
      ...rows.map((row) => `| ${row.join(" | ")} |`)
    ]
    onChange(mdLines.join("\n"))
  }

  const handleCellChange = (rIdx: number, cIdx: number, val: string) => {
    const next = grid.map((row, r) => 
      row.map((cell, c) => (r === rIdx && c === cIdx ? val : cell))
    )
    setGrid(next)
    updateMarkdown(next)
  }

  const addColumn = () => {
    const next = grid.map((row, rIdx) => [...row, rIdx === 0 ? `Header ${row.length + 1}` : ""])
    setGrid(next)
    updateMarkdown(next)
  }

  const removeColumn = (cIdx: number) => {
    if (grid[0].length <= 1) return
    const next = grid.map((row) => row.filter((_, c) => c !== cIdx))
    setGrid(next)
    updateMarkdown(next)
  }

  const addRow = () => {
    const numCols = grid[0].length
    const next = [...grid, Array(numCols).fill("")]
    setGrid(next)
    updateMarkdown(next)
  }

  const removeRow = (rIdx: number) => {
    if (grid.length <= 2) return
    const next = grid.filter((_, r) => r !== rIdx)
    setGrid(next)
    updateMarkdown(next)
  }

  const resetTable = () => {
    const defaultGrid = [
      ["Header 1", "Header 2", "Header 3"],
      ["", "", ""],
      ["", "", ""]
    ]
    setGrid(defaultGrid)
    updateMarkdown(defaultGrid)
  }

  return (
    <div className="space-y-3 p-4 bg-slate-50 border border-indigo-100 rounded-xl">
      <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-100">
        <div className="flex items-center gap-2">
          <IconTable className="text-indigo-600 shrink-0" size={18} />
          <span className="text-xs font-bold text-gray-800">Visual Table Editor</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsRaw(!isRaw)}
            className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-200 transition"
          >
            {isRaw ? "Visual Mode" : "Markdown Mode"}
          </button>
          {!isRaw && (
            <>
              <button
                type="button"
                onClick={addColumn}
                className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 hover:bg-indigo-100/70 transition"
              >
                + Col
              </button>
              <button
                type="button"
                onClick={addRow}
                className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 hover:bg-indigo-100/70 transition"
              >
                + Row
              </button>
              <button
                type="button"
                onClick={resetTable}
                className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-600 rounded-lg border border-rose-100 hover:bg-rose-100/70 transition"
              >
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {isRaw ? (
        <textarea
          rows={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="| Column 1 | Column 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |"
          className="w-full text-xs font-semibold px-3.5 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-none focus:border-indigo-400 text-black font-mono resize-y"
        />
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70">
                {grid[0].map((headerVal, cIdx) => (
                  <th key={cIdx} className="p-2 border-r border-gray-200 last:border-r-0 min-w-[125px]">
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded px-1.5 py-0.5">
                      <input
                        type="text"
                        value={headerVal}
                        onChange={(e) => handleCellChange(0, cIdx, e.target.value)}
                        className="w-full text-xs font-bold text-indigo-950 bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeColumn(cIdx)}
                        disabled={grid[0].length <= 1}
                        className="text-gray-400 hover:text-red-500 disabled:opacity-35 font-bold text-xs shrink-0"
                      >
                        ×
                      </button>
                    </div>
                  </th>
                ))}
                <th className="p-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {grid.slice(1).map((row, rIdx) => {
                const actualRowIdx = rIdx + 1
                return (
                  <tr key={rIdx} className="hover:bg-slate-50/50">
                    {row.map((cellVal, cIdx) => (
                      <td key={cIdx} className="p-2 border-r border-gray-200 last:border-r-0">
                        <input
                          type="text"
                          value={cellVal}
                          onChange={(e) => handleCellChange(actualRowIdx, cIdx, e.target.value)}
                          placeholder="e.g. text [7]"
                          className="w-full text-xs bg-transparent focus:outline-none focus:bg-white px-2 py-1 border border-transparent focus:border-indigo-300 rounded text-black font-semibold placeholder:text-gray-300 placeholder:font-normal"
                        />
                      </td>
                    ))}
                    <td className="p-2 text-center w-8">
                      <button
                        type="button"
                        onClick={() => removeRow(actualRowIdx)}
                        disabled={grid.length <= 2}
                        className="text-gray-400 hover:text-red-500 disabled:opacity-35 text-xs"
                      >
                        <IconTrash size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[10px] text-gray-500 bg-white p-2 rounded-lg border border-gray-100 flex items-center gap-1 font-medium leading-relaxed">
        <IconInfoCircle size={14} className="text-indigo-500 shrink-0" />
        <span>Type text into any cell. Write <strong>[7]</strong>, <strong>[8]</strong>, etc., to insert blank input boxes for those question numbers.</span>
      </p>
    </div>
  )
}

interface FormatToolbarProps {
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>
  value: string
  onChange: (val: string) => void
  label?: string
}

function FormatToolbar({ inputRef, value, onChange, label }: FormatToolbarProps) {
  const handleBold = () => {
    const input = inputRef.current
    if (!input) return
    const start = input.selectionStart ?? 0
    const end = input.selectionEnd ?? 0
    const selectedText = value.substring(start, end)
    const replacement = `**${selectedText}**`
    const newValue = value.substring(0, start) + replacement + value.substring(end)
    onChange(newValue)
    
    setTimeout(() => {
      input.focus()
      input.setSelectionRange(start + 2, start + 2 + selectedText.length)
    }, 0)
  }

  return (
    <div className="flex justify-between items-center mb-1">
      {label && (
        <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block font-bold">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={handleBold}
        className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded hover:bg-indigo-100 transition-all duration-150 shrink-0"
        title="Make selected text bold"
      >
        <IconBold size={12} className="stroke-[3]" />
        <span>Bold</span>
      </button>
    </div>
  )
}

interface FormatInputProps {
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (val: string) => void
  placeholder: string
  required?: boolean
}

function FormatInput({ inputRef, value, onChange, placeholder, required }: FormatInputProps) {
  const handleBold = () => {
    const input = inputRef.current
    if (!input) return
    const start = input.selectionStart ?? 0
    const end = input.selectionEnd ?? 0
    const selectedText = value.substring(start, end)
    const replacement = `**${selectedText}**`
    const newValue = value.substring(0, start) + replacement + value.substring(end)
    onChange(newValue)
    
    setTimeout(() => {
      input.focus()
      input.setSelectionRange(start + 2, start + 2 + selectedText.length)
    }, 0)
  }

  return (
    <div className="relative flex items-start w-full">
      <textarea
        ref={inputRef}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full text-xs font-semibold pl-3 pr-8 py-2 border border-indigo-100 rounded-lg focus:outline-none focus:border-indigo-400 text-black placeholder:text-gray-400 bg-white resize-y"
      />
      <button
        type="button"
        onClick={handleBold}
        className="absolute right-2 top-2 text-indigo-400 hover:text-indigo-600 transition-colors p-1"
        title="Bold"
      >
        <IconBold size={12} className="stroke-[3]" />
      </button>
    </div>
  )
}

function convertMarkdownToHtml(text: string): string {
  if (!text) return "";
  
  // Escape HTML to prevent injection, but allow paragraph and bold formatting we control
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
    
  // Convert **bold** to strong
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-black">$1</strong>');
  
  // Convert newlines to paragraphs
  const paragraphs = html.split(/\n\s*\n/);
  const formattedParagraphs = paragraphs.map(p => {
    const lines = p.split(/\n/);
    return `<p class="mb-4 text-justify leading-relaxed text-gray-800">${lines.join('<br/>')}</p>`;
  });
  
  return formattedParagraphs.join("");
}

function TeacherDashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const editId = searchParams.get('edit')
  const [loadingEdit, setLoadingEdit] = useState(false)

  const [activeTab, setActiveTab] = useState<'reading' | 'listening' | 'writing' | 'speaking'>('reading')
  const [selectedQuestionType, setSelectedQuestionType] = useState<string | null>(null)
  
  // Exam metadata states
  const [examTitle, setExamTitle] = useState('')
  const [examDescription, setExamDescription] = useState('')
  const [examDuration, setExamDuration] = useState(60)
  const [passageCount, setPassageCount] = useState<1 | 2 | 3>(3)

  // Load exam for editing
  useEffect(() => {
    if (!editId) return;

    const loadExam = async () => {
      setLoadingEdit(true);
      try {
        const res = await readingService.getExamById(editId);
        const exam = res.data;
        
        setExamTitle(exam.title);
        setExamDescription(exam.description || "");
        setExamDuration(exam.duration);
        
        const initialPassages: Record<1 | 2 | 3, PassageData> = {
          1: { title: '', body: '', instruction: '', pdf: null, image: null, imageName: '' },
          2: { title: '', body: '', instruction: '', pdf: null, image: null, imageName: '' },
          3: { title: '', body: '', instruction: '', pdf: null, image: null, imageName: '' }
        };
        
        exam.passages?.forEach((p: any) => {
          const idx = p.order as 1 | 2 | 3;
          initialPassages[idx] = {
            title: p.title || "",
            body: p.body || "",
            instruction: p.instruction || "",
            pdf: p.pdfUrl ? { name: "Uploaded PDF", size: "Unknown", url: p.pdfUrl } : null,
            image: p.imageUrl || null,
            imageName: p.imageUrl ? "Uploaded Image" : "",
          };
        });
        setPassages(initialPassages);

        const loadedQuestions: QuestionItem[] = [];
        exam.passages?.forEach((passage: any) => {
          const passageIdx = passage.order as 1 | 2 | 3;
          passage.questionGroups?.forEach((group: any) => {
            group.questions?.forEach((q: any) => {
              // Reconstruct correct answer for MCQ
              let correctAnswer = q.correctAnswer;
              if (group.type === "MULTIPLE_CHOICE" && q.options && q.options.length > 0) {
                const idx = q.options.indexOf(q.correctAnswer);
                if (idx === 0) correctAnswer = "A";
                else if (idx === 1) correctAnswer = "B";
                else if (idx === 2) correctAnswer = "C";
                else if (idx === 3) correctAnswer = "D";
              }

              loadedQuestions.push({
                id: q.id || `q-${Date.now()}-${Math.random()}`,
                passageIndex: passageIdx,
                type: readingQuestionTypes.find(t => t.type === group.type)?.title || group.type,
                typeCode: group.type,
                questionNumber: q.questionNumber,
                text: q.questionText || "",
                instruction: group.instruction || "",
                correctAnswer: correctAnswer,
                explanation: q.explanation || "",
                options: q.options || undefined,
                groupOptions: group.options || undefined,
                passageSegment: group.passageSegment || undefined,
                groupImageUrl: group.imageUrl || undefined
              });
            });
          });
        });
        
        setCompiledQuestions(loadedQuestions.sort((a, b) => a.questionNumber - b.questionNumber));
        toast.success("Exam loaded for editing!");
      } catch (err: any) {
        toast.error("Failed to load exam: " + (err?.response?.data?.message || err.message));
      } finally {
        setLoadingEdit(false);
      }
    };

    loadExam();
  }, [editId]);

  // 3 Passages independent states
  const [activePassage, setActivePassage] = useState<1 | 2 | 3>(1)
  const [passages, setPassages] = useState<Record<1 | 2 | 3, PassageData>>({
    1: { 
      title: '', 
      body: '', 
      instruction: 'You should spend about 20 minutes on Questions 1-13 which are based on Reading Passage 1 below.', 
      pdf: null, 
      image: null, 
      imageName: '' 
    },
    2: { 
      title: '', 
      body: '', 
      instruction: 'You should spend about 20 minutes on Questions 14-26 which are based on Reading Passage 2 below.', 
      pdf: null, 
      image: null, 
      imageName: '' 
    },
    3: { 
      title: '', 
      body: '', 
      instruction: 'You should spend about 20 minutes on Questions 27-40 which are based on Reading Passage 3 below.', 
      pdf: null, 
      image: null, 
      imageName: '' 
    },
  })

  // Uploading states
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingQImage, setUploadingQImage] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  // PDF & Image input references
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Question Form States
  const [customQuestionNumber, setCustomQuestionNumber] = useState<number | ''>('')
  const [questionText, setQuestionText] = useState('')
  const [questionInstruction, setQuestionInstruction] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [questionExplanation, setQuestionExplanation] = useState('')
  
  // Custom MCQ options
  const [mcqOptA, setMcqOptA] = useState('')
  const [mcqOptB, setMcqOptB] = useState('')
  const [mcqOptC, setMcqOptC] = useState('')
  const [mcqOptD, setMcqOptD] = useState('')

  // Custom Matching options / list of headings (newlines)
  const [groupOptions, setGroupOptions] = useState('')

  // Custom Table completion segment markdown
  const [passageSegment, setPassageSegment] = useState('')

  // Sentence Completion mode: With Clues vs Without Clues
  const [scompMode, setScompMode] = useState<'WITH_CLUES' | 'WITHOUT_CLUES'>('WITHOUT_CLUES')

  // Matching Headings Configurations
  const [mhdgMode, setMhdgMode] = useState<'WITH_CLUES' | 'WITHOUT_CLUES'>('WITH_CLUES')
  const [hasExample, setHasExample] = useState(false)
  const [exampleParagraph, setExampleParagraph] = useState('')
  const [exampleAnswer, setExampleAnswer] = useState('')

  // Question attachments
  const [questionImage, setQuestionImage] = useState<string | null>(null)
  const [questionImageName, setQuestionImageName] = useState('')
  const qImageInputRef = useRef<HTMLInputElement>(null)

  // Refs for formatting fields
  const instructionRef = useRef<HTMLTextAreaElement>(null)
  const groupOptionsRef = useRef<HTMLTextAreaElement>(null)
  const passageSegmentRef = useRef<HTMLTextAreaElement>(null)
  const questionTextRef = useRef<HTMLTextAreaElement>(null)
  const mcqOptARef = useRef<HTMLTextAreaElement>(null)
  const mcqOptBRef = useRef<HTMLTextAreaElement>(null)
  const mcqOptCRef = useRef<HTMLTextAreaElement>(null)
  const mcqOptDRef = useRef<HTMLTextAreaElement>(null)
  const explanationRef = useRef<HTMLTextAreaElement>(null)
  const answerInputRef = useRef<HTMLTextAreaElement>(null)
  const passageInstructionRef = useRef<HTMLTextAreaElement>(null)
  const passageTitleRef = useRef<HTMLTextAreaElement>(null)
  const passageBodyRef = useRef<HTMLTextAreaElement>(null)

  // Compiled questions for all passages (Target 40)
  const [compiledQuestions, setCompiledQuestions] = useState<QuestionItem[]>([])
  
  // Helper: Update active passage field
  const updatePassageField = (field: keyof PassageData, value: any) => {
    setPassages({
      ...passages,
      [activePassage]: {
        ...passages[activePassage],
        [field]: value
      }
    })
  }

  // Passage PDF selection handler
  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setUploadingPdf(true)
      try {
        const formData = new FormData()
        formData.append("file", file)
        const res = await readingService.uploadFile(formData)
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2)
        updatePassageField('pdf', {
          name: file.name,
          size: `${sizeMb} MB`,
          url: res.data.url
        })
        toast.success("PDF uploaded successfully!")
      } catch (err: any) {
        toast.error("PDF upload failed: " + (err?.response?.data?.message || err.message))
      } finally {
        setUploadingPdf(false)
      }
    }
  }

  // Passage/Question Image selection handler
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, isQuestionImage = false) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (isQuestionImage) setUploadingQImage(true)
      else setUploadingImage(true)

      try {
        const formData = new FormData()
        formData.append("file", file)
        const res = await readingService.uploadFile(formData)
        if (isQuestionImage) {
          setQuestionImage(res.data.url)
          setQuestionImageName(file.name)
        } else {
          updatePassageField('image', res.data.url)
          updatePassageField('imageName', file.name)
        }
        toast.success("Image uploaded successfully!")
      } catch (err: any) {
        toast.error("Image upload failed: " + (err?.response?.data?.message || err.message))
      } finally {
        if (isQuestionImage) setUploadingQImage(false)
        else setUploadingImage(false)
      }
    }
  }

  // Add Question to Compiled list for active passage
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!questionInstruction || !correctAnswer) {
      toast.error("Please fill in the required instruction and correct answer values.")
      return
    }

    const selectedTypeDetails = readingQuestionTypes.find(t => t.code === selectedQuestionType)
    if (!selectedTypeDetails) return

    // Auto-calculate or use custom question number
    const qNum = customQuestionNumber !== '' ? Number(customQuestionNumber) : compiledQuestions.length + 1

    // Map correct answer and options based on MCQ or other types
    let finalCorrectAnswer = correctAnswer
    let finalOptions: string[] = []
    if (selectedTypeDetails.type === "MULTIPLE_CHOICE") {
      finalOptions = [mcqOptA, mcqOptB, mcqOptC, mcqOptD].filter(Boolean)
      if (correctAnswer === "A") finalCorrectAnswer = mcqOptA
      else if (correctAnswer === "B") finalCorrectAnswer = mcqOptB
      else if (correctAnswer === "C") finalCorrectAnswer = mcqOptC
      else if (correctAnswer === "D") finalCorrectAnswer = mcqOptD
    }

    let finalGroupOptions: string[] = []
    if (
      ["MATCHING_HEADINGS", "MATCHING_FEATURES", "MATCHING_INFORMATION", "MATCHING_SENTENCE_ENDINGS", "SUMMARY_COMPLETION_WITH_OPTIONS"].includes(selectedTypeDetails.type) ||
      (selectedQuestionType === "R-SCOMP" && scompMode === "WITH_CLUES")
    ) {
      finalGroupOptions = groupOptions.split("\n").map(o => o.trim()).filter(Boolean)
    }

    const newQ: QuestionItem = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      passageIndex: activePassage,
      type: selectedTypeDetails.title,
      typeCode: selectedTypeDetails.type,
      questionNumber: qNum,
      text: questionText,
      instruction: questionInstruction,
      correctAnswer: finalCorrectAnswer,
      explanation: questionExplanation,
      options: finalOptions.length > 0 ? finalOptions : undefined,
      groupOptions: finalGroupOptions.length > 0 ? finalGroupOptions : undefined,
      passageSegment: selectedTypeDetails.type === "MATCHING_HEADINGS"
        ? JSON.stringify({
            mode: mhdgMode,
            exampleParagraph: hasExample ? exampleParagraph : "",
            exampleAnswer: hasExample ? exampleAnswer : ""
          })
        : ["TABLE_COMPLETION", "NOTES_COMPLETION", "FLOW_CHART_COMPLETION", "SUMMARY_COMPLETION_WITH_OPTIONS", "SUMMARY_COMPLETION_WITHOUT_OPTIONS", "SENTENCE_COMPLETION"].includes(selectedTypeDetails.type)
        ? passageSegment
        : undefined,
      groupImageUrl: questionImage || undefined
    }

    // Sort questions by question number
    setCompiledQuestions([...compiledQuestions, newQ].sort((a, b) => a.questionNumber - b.questionNumber))
    
    // Reset Form
    setQuestionText('')
    setQuestionExplanation('')
    setCorrectAnswer('')
    setCustomQuestionNumber('')
    setMcqOptA('')
    setMcqOptB('')
    setMcqOptC('')
    setMcqOptD('')
    setQuestionImage(null)
    setQuestionImageName('')
    // Keep instruction, groupOptions, and table template for convenience when adding sequential questions
    toast.success(`Question ${qNum} added!`)
  }

  // Delete Question
  const handleDeleteQuestion = (id: string) => {
    setCompiledQuestions(compiledQuestions.filter(q => q.id !== id))
  }

  // Complete Paper Publish
  const handlePublishPaper = async () => {
    if (!examTitle.trim()) {
      toast.error("Please enter an exam title.")
      return
    }

    // Validate passages up to passageCount
    for (let idx = 1; idx <= passageCount; idx++) {
      if (!passages[idx as 1 | 2 | 3].title) {
        toast.error(`Please ensure Passage ${idx} has a title drafted.`)
        return
      }
    }

    setIsPublishing(true)
    try {
      // Re-map flat questions list into nested structure expected by database
      const mappedPassages = Array.from({ length: passageCount }, (_, i) => i + 1).map((idx) => {
        const p = passages[idx as 1 | 2 | 3]
        const passageQuestions = compiledQuestions.filter(q => q.passageIndex === idx)
        
        // Group questions sequentially
        const questionGroups: any[] = []
        let currentGroup: any = null

        for (const q of passageQuestions) {
          const isSameType = currentGroup && currentGroup.type === q.typeCode;
          if (isSameType) {
            if ((!currentGroup.options || currentGroup.options.length === 0) && q.groupOptions && q.groupOptions.length > 0) {
              currentGroup.options = q.groupOptions;
            }
            if (!currentGroup.passageSegment && q.passageSegment) {
              currentGroup.passageSegment = q.passageSegment;
            }
            if (!currentGroup.instruction && q.instruction) {
              currentGroup.instruction = q.instruction;
            }
            if (!currentGroup.imageUrl && q.groupImageUrl) {
              currentGroup.imageUrl = q.groupImageUrl;
            }
          } else {
            currentGroup = {
              type: q.typeCode,
              instruction: q.instruction || "",
              passageSegment: q.passageSegment || "",
              options: q.groupOptions || [],
              imageUrl: q.groupImageUrl || "",
              order: questionGroups.length + 1,
              questions: []
            }
            questionGroups.push(currentGroup)
          }

          currentGroup.questions.push({
            questionNumber: q.questionNumber,
            questionText: q.text || "",
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || ""
          })
        }

        // Formulate instructions and title as pre-formatted HTML prepended to the body
        const instructionHtml = p.instruction 
          ? `<div class="mb-6 p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-750 leading-relaxed font-semibold italic shadow-sm">
               <span class="text-xs font-black uppercase tracking-wider block text-indigo-700 mb-1">READING PASSAGE ${idx}</span>
               ${convertMarkdownToHtml(p.instruction)}
             </div>` 
          : `<div class="mb-6 p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-750 leading-relaxed font-semibold italic shadow-sm">
               <span class="text-xs font-black uppercase tracking-wider block text-indigo-700 mb-1">READING PASSAGE ${idx}</span>
               You should spend about 20 minutes on Questions which are based on Reading Passage ${idx} below.
             </div>`;
             
        const titleHtml = `<h2 class="text-2xl font-extrabold text-black mb-5 mt-2 tracking-tight whitespace-pre-wrap">${p.title}</h2>`;
        const bodyHtml = convertMarkdownToHtml(p.body || "");
        const combinedText = `${instructionHtml}${titleHtml}${bodyHtml}`;

        return {
          title: p.title,
          text: combinedText,
          body: p.body || "",
          instruction: p.instruction || "",
          pdfUrl: p.pdf?.url || "",
          imageUrl: p.image || "",
          order: idx,
          questionGroups
        }
      })

      const examPayload = {
        title: examTitle.trim(),
        description: examDescription.trim() || "IELTS Academic Reading Mock Exam",
        duration: Number(examDuration) || 60,
        isPublished: true,
        passages: mappedPassages
      }

      if (editId) {
        await readingService.updateExam(editId, examPayload)
        toast.success("Congratulations! IELTS Exam updated successfully.")
        router.push("/teacher/exams")
      } else {
        await readingService.createExam(examPayload)
        toast.success("Congratulations! IELTS Exam created successfully.")

        // Reset everything on success
        setExamTitle('')
        setExamDescription('')
        setExamDuration(60)
        setPassageCount(3)
        setPassages({
          1: { 
            title: '', 
            body: '', 
            instruction: 'You should spend about 20 minutes on Questions 1-13 which are based on Reading Passage 1 below.', 
            pdf: null, 
            image: null, 
            imageName: '' 
          },
          2: { 
            title: '', 
            body: '', 
            instruction: 'You should spend about 20 minutes on Questions 14-26 which are based on Reading Passage 2 below.', 
            pdf: null, 
            image: null, 
            imageName: '' 
          },
          3: { 
            title: '', 
            body: '', 
            instruction: 'You should spend about 20 minutes on Questions 27-40 which are based on Reading Passage 3 below.', 
            pdf: null, 
            image: null, 
            imageName: '' 
          },
        })
        setCompiledQuestions([])
        setSelectedQuestionType(null)
        setGroupOptions('')
        setPassageSegment('')
        setActivePassage(1)
      }
    } catch (err: any) {
      toast.error("Failed to publish mock exam: " + (err?.response?.data?.message || err.message))
    } finally {
      setIsPublishing(false)
    }
  }

  // Helper to count questions by passage index
  const getQuestionCountForPassage = (idx: 1 | 2 | 3) => {
    return compiledQuestions.filter(q => q.passageIndex === idx).length
  }

  if (loadingEdit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
        <IconLoader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-sm font-bold text-gray-500">Loading exam draft for editing...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      
      {/* Top Welcome & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />
        
        <div className="space-y-1.5 flex-1 min-w-0">
          <h1 className="text-3xl font-black tracking-tight text-black flex items-center gap-2">
            <IconNotebook size={28} className="text-indigo-600" />
            IELTS Exam Desk
          </h1>
          <p className="text-gray-500 font-semibold text-sm">
            Create custom IELTS academic reading mocks with <strong className="text-indigo-600">1, 2, or 3 Passages</strong> and up to <strong className="text-indigo-600">40 Questions</strong>.
          </p>
        </div>

        <Button 
          onClick={handlePublishPaper}
          disabled={isPublishing || !examTitle || Array.from({ length: passageCount }, (_, i) => i + 1).some(idx => !passages[idx as 1 | 2 | 3].title)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-200 disabled:text-gray-400 font-bold transition-all duration-200 shadow-md shadow-indigo-100 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm shrink-0"
        >
          {isPublishing ? (
            <IconLoader2 size={16} className="animate-spin" />
          ) : (
            <IconSparkles size={16} />
          )}
          Publish Mock Exam
        </Button>
      </div>

      {/* Module Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {modules.map((mod) => {
          const Icon = mod.icon
          const isActive = activeTab === mod.id
          
          return (
            <button
              key={mod.id}
              onClick={() => {
                setActiveTab(mod.id as any)
                setSelectedQuestionType(null)
              }}
              className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden ${
                isActive
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100/50'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/20'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 border ${
                isActive ? 'bg-white/20 border-white/15 text-white' : mod.color
              }`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-widest block opacity-70">
                  {mod.id === 'reading' ? 'Active Segment' : 'Locked Segment'}
                </span>
                <span className="font-extrabold text-sm truncate block mt-0.5">{mod.label}</span>
              </div>
              {mod.id !== 'reading' && (
                <span className="absolute top-2 right-2 text-[8px] font-black tracking-widest bg-gray-100 border border-gray-200 text-gray-400 px-1 py-0.5 rounded uppercase">
                  Inactive
                </span>
              )}
            </button>
          )
        })}
      </div>

      {activeTab !== 'reading' ? (
        <Card className="bg-white border-gray-200 shadow-sm py-16 text-center">
          <CardContent className="flex flex-col items-center max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 mb-4">
              <IconAlertCircle size={28} />
            </div>
            <h2 className="text-xl font-black text-black">Module Integration In Progress</h2>
            <p className="text-gray-500 font-semibold text-sm mt-2 leading-relaxed">
              Your website currently has the **Reading Segment** active. The Listening, Writing, and Speaking exam creators are currently reserved as the system integrates.
            </p>
            <Button 
              onClick={() => setActiveTab('reading')}
              className="mt-6 bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 hover:text-indigo-700 font-bold transition-all duration-200"
            >
              Return to Reading Builder <IconArrowRight size={15} className="ml-1" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* 3-Passage Reading Exam Creator Layout */
        <div className="grid gap-6 lg:grid-cols-12 animate-fadeIn">
          
          {/* Main Workspace Column (8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Exam metadata specifications */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="font-bold text-black text-lg">Exam Metadata</CardTitle>
                <CardDescription className="text-gray-500 font-medium">Set the title, instructions description, and duration timer for this complete mock exam.</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">Mock Exam Title <span className="text-rose-500">*</span></label>
                    <textarea 
                      rows={2}
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      placeholder="e.g. Cambridge IELTS Academic Reading Practice Test 1" 
                      className="w-full font-bold text-sm text-black px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-gray-50/50 text-black placeholder:text-gray-400 resize-y"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">Duration (Minutes)</label>
                    <input 
                      type="number" 
                      value={examDuration}
                      onChange={(e) => setExamDuration(Number(e.target.value))}
                      placeholder="60" 
                      className="w-full font-bold text-sm text-black px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-gray-50/50 text-black"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">Description Instruction (Optional)</label>
                  <textarea 
                    rows={2}
                    value={examDescription}
                    onChange={(e) => setExamDescription(e.target.value)}
                    placeholder="e.g. Academic reading evaluation. Consists of 3 sections." 
                    className="w-full font-bold text-sm text-black px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-gray-50/50 text-black placeholder:text-gray-400 resize-y"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Passage Count Selector */}


            {/* Passage Segment Selector */}
            <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm flex gap-2 w-full">
              {([1, 2, 3] as const).slice(0, passageCount).map((idx) => {
                const isSelected = activePassage === idx
                const isPassageComplete = passages[idx].title !== ''
                const qCount = getQuestionCountForPassage(idx)
                
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActivePassage(idx)
                      setSelectedQuestionType(null)
                    }}
                    className={`flex-1 flex flex-col sm:flex-row items-center justify-between p-3.5 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100/50 font-bold'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-100 hover:bg-indigo-50/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-white text-indigo-700' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {idx}
                      </span>
                      <div className="text-left">
                        <p className="text-[10px] font-bold uppercase tracking-wider block opacity-75">IELTS Passage</p>
                        <p className="font-extrabold text-xs block mt-0.5 sm:hidden">P{idx}</p>
                        <p className="font-extrabold text-xs hidden sm:block">Passage {idx}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : isPassageComplete 
                            ? 'bg-indigo-50 text-indigo-600' 
                            : 'bg-gray-100 text-gray-400'
                      }`}>
                        {isPassageComplete ? 'Text Drafted' : 'Empty'}
                      </span>
                      <span className={`text-[10px] font-black shrink-0 ${
                        isSelected ? 'text-white' : 'text-gray-500'
                      }`}>
                        {qCount} Qs
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Passage Form Card */}
            <Card className="bg-white border-gray-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 h-4 w-full bg-gradient-to-r from-indigo-500 to-indigo-600" />
              
              <CardHeader className="pb-3 border-b border-gray-100 pt-7">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="font-extrabold text-black text-lg flex items-center gap-2">
                      Passage {activePassage} Specifications
                    </CardTitle>
                    <CardDescription className="text-gray-500 font-medium">Input reading text body, upload documents (PDF) or graphs (Images) for Passage {activePassage}.</CardDescription>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">
                    Section {activePassage}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="pt-5 space-y-5">
                
                {/* Passage Instruction Header */}
                <div className="space-y-1">
                  <FormatToolbar 
                    inputRef={passageInstructionRef}
                    value={passages[activePassage].instruction || ''}
                    onChange={(val) => updatePassageField('instruction', val)}
                    label={`Passage ${activePassage} Instructions Header`}
                  />
                  <textarea 
                    ref={passageInstructionRef}
                    rows={2}
                    value={passages[activePassage].instruction || ''}
                    onChange={(e) => updatePassageField('instruction', e.target.value)}
                    placeholder="e.g. You should spend about 20 minutes on Questions 14-26 which are based on Reading Passage 2 below." 
                    className="w-full text-xs font-semibold px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-gray-50/50 text-black placeholder:text-gray-400 resize-y"
                  />
                </div>

                {/* Passage Title */}
                <div className="space-y-1">
                  <FormatToolbar 
                    inputRef={passageTitleRef}
                    value={passages[activePassage].title}
                    onChange={(val) => updatePassageField('title', val)}
                    label={`Passage ${activePassage} Title`}
                  />
                  <textarea 
                    ref={passageTitleRef}
                    rows={2}
                    value={passages[activePassage].title}
                    onChange={(e) => updatePassageField('title', e.target.value)}
                    placeholder={`e.g. Passage ${activePassage}: History and Development of English Bridges`} 
                    className="w-full font-semibold text-xs text-black px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-gray-50/50 text-black placeholder:text-gray-400 resize-y"
                  />
                </div>

                {/* PDF & Image Upload System */}
                <div className="grid gap-4 md:grid-cols-2">
                  
                  {/* PDF Upload */}
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Attach Passage PDF</label>
                    <input 
                      type="file" 
                      accept=".pdf" 
                      ref={pdfInputRef}
                      onChange={handlePdfChange}
                      className="hidden" 
                    />
                    
                    {uploadingPdf ? (
                      <div className="flex flex-col items-center justify-center p-5 border border-indigo-200 bg-indigo-50/30 rounded-xl h-36">
                        <IconLoader2 size={32} className="text-indigo-600 animate-spin" />
                        <span className="text-xs text-indigo-950 font-bold mt-2">Uploading PDF to Cloudinary...</span>
                      </div>
                    ) : passages[activePassage].pdf ? (
                      <div className="flex flex-col items-center justify-center p-5 border border-indigo-200 bg-indigo-50/30 rounded-xl shrink-0 h-36 text-center animate-fadeIn">
                        <IconFileText size={32} className="text-indigo-600" />
                        <span className="font-bold text-xs text-indigo-950 mt-2 max-w-[200px] truncate">{passages[activePassage].pdf?.name}</span>
                        <span className="text-[10px] text-indigo-500 font-bold mt-0.5">{passages[activePassage].pdf?.size}</span>
                        <Button 
                          onClick={() => updatePassageField('pdf', null)}
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700 font-bold hover:bg-transparent text-[10px] mt-1.5 h-6 p-0"
                        >
                          Remove PDF
                        </Button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => pdfInputRef.current?.click()}
                        className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-200 hover:border-indigo-300 rounded-xl cursor-pointer hover:bg-gray-50/40 transition-all duration-200 h-36 text-center group"
                      >
                        <IconCloudUpload size={32} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
                        <span className="font-bold text-xs text-gray-800 mt-2">Upload Passage {activePassage} PDF</span>
                        <span className="text-[10px] text-gray-400 font-semibold mt-1">Accepts formal PDF file transcripts</span>
                      </div>
                    )}
                  </div>

                  {/* Image Upload */}
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Attach Passage Image Diagram</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={imageInputRef}
                      onChange={(e) => handleImageChange(e)}
                      className="hidden" 
                    />
                    
                    {uploadingImage ? (
                      <div className="flex flex-col items-center justify-center p-5 border border-indigo-200 bg-indigo-50/30 rounded-xl h-36">
                        <IconLoader2 size={32} className="text-indigo-600 animate-spin" />
                        <span className="text-xs text-indigo-950 font-bold mt-2">Uploading Image...</span>
                      </div>
                    ) : passages[activePassage].image ? (
                      <div className="relative group rounded-xl overflow-hidden border border-gray-200 h-36 flex items-center justify-center bg-gray-50/50 animate-fadeIn">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={passages[activePassage].image || ''} alt="Passage visual chart reference" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center transition-opacity duration-200 text-white p-2">
                          <span className="font-bold text-xs truncate max-w-[150px]">{passages[activePassage].imageName}</span>
                          <Button 
                            onClick={() => { updatePassageField('image', null); updatePassageField('imageName', ''); }}
                            variant="ghost" 
                            size="sm" 
                            className="text-red-400 hover:text-red-600 font-bold hover:bg-transparent text-[10px] mt-2 h-6 p-0"
                          >
                            Remove Image
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => imageInputRef.current?.click()}
                        className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-200 hover:border-indigo-300 rounded-xl cursor-pointer hover:bg-gray-50/40 transition-all duration-200 h-36 text-center group"
                      >
                        <IconPhoto size={32} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
                        <span className="font-bold text-xs text-gray-800 mt-2">Upload Visual Diagram</span>
                        <span className="text-[10px] text-gray-400 font-semibold mt-1">For chart, graph, map details</span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Passage Body Text */}
                <div className="space-y-1">
                  <FormatToolbar 
                    inputRef={passageBodyRef}
                    value={passages[activePassage].body}
                    onChange={(val) => updatePassageField('body', val)}
                    label={`Passage ${activePassage} Body Text`}
                  />
                  <textarea 
                    ref={passageBodyRef}
                    rows={8}
                    value={passages[activePassage].body}
                    onChange={(e) => updatePassageField('body', e.target.value)}
                    placeholder="Enter the full Reading Passage paragraphs..." 
                    className="w-full text-xs font-semibold px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-gray-50/50 text-black placeholder:text-gray-400 resize-y"
                  />
                </div>

              </CardContent>
            </Card>

            {/* Questions Configurator */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="font-bold text-black text-lg">Add Questions to Passage {activePassage}</CardTitle>
                <CardDescription className="text-gray-500 font-medium">Select an official IELTS question type to build and associate questions specifically under Passage {activePassage}.</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-5 space-y-5">
                
                {/* Question Types List Grid */}
                <div className="grid gap-2 sm:grid-cols-3">
                  {readingQuestionTypes.map((type) => {
                    const isSelected = selectedQuestionType === type.code
                    return (
                      <button
                        key={type.code}
                        type="button"
                        onClick={() => setSelectedQuestionType(type.code)}
                        className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/75 border-indigo-400 text-indigo-950 font-bold ring-2 ring-indigo-100 shadow-inner'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/20'
                        }`}
                      >
                        <span className="text-[8px] font-black uppercase bg-indigo-50 border border-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded block w-max">
                          {type.code}
                        </span>
                        <h4 className="font-extrabold text-xs text-black mt-2 leading-snug">{type.title}</h4>
                        <p className="text-[10px] text-gray-400 font-semibold mt-1 leading-normal line-clamp-2">{type.desc}</p>
                      </button>
                    )
                  })}
                </div>

                {/* Question Building Form */}
                {selectedQuestionType ? (
                  <form onSubmit={handleAddQuestion} className="p-5 border border-indigo-100 bg-indigo-50/20 rounded-xl space-y-4 animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-indigo-100/50 pb-2">
                      <span className="text-xs font-black text-indigo-950">
                        Configuring for Passage {activePassage}: {readingQuestionTypes.find(t => t.code === selectedQuestionType)?.title}
                      </span>
                      <Button 
                        type="button"
                        onClick={() => setSelectedQuestionType(null)} 
                        variant="ghost" 
                        className="text-[10px] text-gray-400 font-bold h-6 hover:bg-transparent"
                      >
                        Cancel
                      </Button>
                    </div>

                    {selectedQuestionType === "R-SCOMP" && (
                      <div className="bg-white p-3 rounded-lg border border-indigo-100/55 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-gray-800">Sentence Completion Clue Type</span>
                          <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">Decide if students get a clues box (Inline select list) or type answers directly (Free text).</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setScompMode("WITHOUT_CLUES")}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-150 ${
                              scompMode === "WITHOUT_CLUES"
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                : "bg-slate-50 border-gray-200 text-gray-700 hover:bg-slate-100"
                            }`}
                          >
                            Without Clues
                          </button>
                          <button
                            type="button"
                            onClick={() => setScompMode("WITH_CLUES")}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-150 ${
                              scompMode === "WITH_CLUES"
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                : "bg-slate-50 border-gray-200 text-gray-700 hover:bg-slate-100"
                            }`}
                          >
                            With Clues
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedQuestionType === "R-MHDG" && (
                      <div className="bg-white p-4 rounded-xl border border-indigo-100/55 space-y-4 shadow-sm animate-fadeIn">
                        {/* Clue Mode Toggle */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-50/50 pb-3">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-gray-800">Matching Headings Clue Type</span>
                            <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">Choose whether students select headings from a dropdown list (With Clues) or manually type Roman numerals (Without Clues).</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setMhdgMode("WITHOUT_CLUES")}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-150 ${
                                mhdgMode === "WITHOUT_CLUES"
                                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                  : "bg-slate-50 border-gray-200 text-gray-700 hover:bg-slate-100"
                              }`}
                            >
                              Without Clues
                            </button>
                            <button
                              type="button"
                              onClick={() => setMhdgMode("WITH_CLUES")}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-150 ${
                                mhdgMode === "WITH_CLUES"
                                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                  : "bg-slate-50 border-gray-200 text-gray-700 hover:bg-slate-100"
                              }`}
                            >
                              With Clues
                            </button>
                          </div>
                        </div>

                        {/* Example Checkbox */}
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={hasExample}
                              onChange={(e) => setHasExample(e.target.checked)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                            />
                            <span className="text-xs font-bold text-gray-800">Include Example Question (Standard IELTS format)</span>
                          </label>

                          {hasExample && (
                            <div className="grid gap-3 sm:grid-cols-2 p-3 bg-slate-50/70 border border-slate-200 rounded-lg animate-fadeIn">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block">Example Paragraph/Section</label>
                                <input
                                  type="text"
                                  value={exampleParagraph}
                                  onChange={(e) => setExampleParagraph(e.target.value)}
                                  placeholder="e.g. Paragraph A"
                                  className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 rounded-lg bg-white text-black focus:outline-none focus:border-indigo-400"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block">Example Correct Heading Answer</label>
                                {groupOptions.trim() ? (
                                  <select
                                    value={exampleAnswer}
                                    onChange={(e) => setExampleAnswer(e.target.value)}
                                    className="w-full text-xs font-semibold px-2 py-2 border border-gray-200 rounded-lg bg-white text-black focus:outline-none focus:border-indigo-400"
                                  >
                                    <option value="">-- Choose Option --</option>
                                    {groupOptions.split("\n").map(o => o.trim()).filter(Boolean).map((opt, idx) => (
                                      <option key={idx} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    value={exampleAnswer}
                                    onChange={(e) => setExampleAnswer(e.target.value)}
                                    placeholder="e.g. iii"
                                    className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 rounded-lg bg-white text-black focus:outline-none focus:border-indigo-400"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Question Reference Image */}
                    <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={qImageInputRef}
                        onChange={(e) => handleImageChange(e, true)}
                        className="hidden" 
                      />
                      {uploadingQImage ? (
                        <div className="flex items-center gap-2">
                          <IconLoader2 size={16} className="text-indigo-600 animate-spin shrink-0" />
                          <span className="text-xs font-semibold text-gray-500">Uploading visual chart...</span>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => qImageInputRef.current?.click()}
                          size="sm"
                          variant="outline"
                          className="font-bold border-gray-200 text-xs shrink-0 text-gray-700"
                        >
                          <IconPhoto size={16} className="text-indigo-500 mr-1" />
                          {questionImageName ? 'Change Image' : 'Attach Question Image'}
                        </Button>
                      )}
                      {!uploadingQImage && (
                        <>
                          <span className="text-xs text-gray-400 font-semibold truncate flex-1">
                            {questionImageName || "Optional flowchart, chart segment, or blank labelling visual."}
                          </span>
                          {questionImage && (
                            <Button 
                              onClick={() => { setQuestionImage(null); setQuestionImageName(''); }}
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 p-1 hover:bg-transparent"
                            >
                              <IconTrash size={16} />
                            </Button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Question Number Override & Instructions */}
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block">Q# (Optional)</label>
                        <input 
                          type="number" 
                          value={customQuestionNumber}
                          onChange={(e) => setCustomQuestionNumber(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder={String(compiledQuestions.length + 1)} 
                          className="w-full text-xs font-bold px-3 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-none focus:border-indigo-400 text-black"
                        />
                      </div>
                      <div className="sm:col-span-3 space-y-1">
                        <FormatToolbar 
                          inputRef={instructionRef}
                          value={questionInstruction}
                          onChange={setQuestionInstruction}
                          label="Group Instructions"
                        />
                        <textarea 
                          ref={instructionRef}
                          rows={2}
                          value={questionInstruction}
                          onChange={(e) => setQuestionInstruction(e.target.value)}
                          placeholder="e.g. Write TRUE, FALSE or NOT GIVEN in boxes 1-5 on your answer sheet." 
                          className="w-full text-xs font-semibold px-3.5 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-none focus:border-indigo-400 text-black placeholder:text-gray-400 resize-y"
                          required
                        />
                      </div>
                    </div>

                    {/* Conditional input: Matching Options */}
                    {(["R-MHDG", "R-MINF", "R-MFT", "R-MSE", "R-SCO"].includes(selectedQuestionType) || (selectedQuestionType === "R-SCOMP" && scompMode === "WITH_CLUES")) && (
                      <div className="space-y-1">
                        <FormatToolbar 
                          inputRef={groupOptionsRef}
                          value={groupOptions}
                          onChange={setGroupOptions}
                          label="List of Options (One per line)"
                        />
                        <textarea 
                          ref={groupOptionsRef}
                          rows={4}
                          value={groupOptions}
                          onChange={(e) => setGroupOptions(e.target.value)}
                          placeholder={
                            selectedQuestionType === "R-SCO" || selectedQuestionType === "R-SCOMP"
                              ? `e.g.\nA  constant conflict\nB  additional evidence\nC  different locations\nD  experimental subjects`
                              : `e.g.\ni   Heading 1\nii  Heading 2\niii Heading 3`
                          } 
                          className="w-full text-xs font-semibold px-3.5 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-none focus:border-indigo-400 text-black placeholder:text-gray-400 resize-none font-mono"
                          required
                        />
                        <p className="text-[10px] text-gray-400 font-semibold">Enter options, features, or headings that the student will select from in a select dropdown.</p>
                      </div>
                    )}

                    {/* Conditional input: Table / Flow-chart / Notes / Summary Template */}
                    {["R-TABLE", "R-FLOW", "R-NCOMP", "R-SCO", "R-SCWO", "R-SCOMP"].includes(selectedQuestionType) && (
                      <div className="space-y-1">
                        {selectedQuestionType === "R-TABLE" ? (
                          <>
                            <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block font-bold mb-1">
                              Table Template Editor <span className="text-rose-500">*</span>
                            </label>
                            <VisualTableBuilder 
                              value={passageSegment} 
                              onChange={(val) => setPassageSegment(val)} 
                            />
                          </>
                        ) : (
                          <>
                            <FormatToolbar 
                              inputRef={passageSegmentRef}
                              value={passageSegment}
                              onChange={setPassageSegment}
                              label="Paragraph / Outline Template"
                            />
                            <textarea 
                              ref={passageSegmentRef}
                              rows={5}
                              value={passageSegment}
                              onChange={(e) => setPassageSegment(e.target.value)}
                              placeholder={
                                selectedQuestionType === "R-FLOW"
                                  ? "Step 1: Process begins\n↓\nStep 2: Temperature rises to [10]\n↓\nStep 3: Output details [11]"
                                  : selectedQuestionType === "R-SCO"
                                  ? "What happens when people encounter misinformation?\n\nAlthough people have [31] to misinformation, there is debate about precisely how and when we label something as true or untrue. The philosophers Descartes and Spinoza had [32] about how people engage..."
                                  : "Write summary text or bulleted notes. Place [1], [2], etc., where blanks should appear."
                              }
                              className="w-full text-xs font-semibold px-3.5 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-none focus:border-indigo-400 text-black placeholder:text-gray-400 font-mono resize-y"
                              required
                            />
                          </>
                        )}
                        <p className="text-[10px] text-gray-400 font-semibold">Define the text or table content. Put placeholders like <strong className="text-indigo-600">[9]</strong> inside cells or text to render dynamic student input fields.</p>
                      </div>
                    )}

                    {/* Question Text */}
                    <div className="space-y-1">
                      <FormatToolbar 
                        inputRef={questionTextRef}
                        value={questionText}
                        onChange={setQuestionText}
                        label={selectedQuestionType === "R-MHDG" ? "Paragraph/Section Reference" : "Question Text Prompt / Template"}
                      />
                      <textarea 
                        ref={questionTextRef}
                        rows={2}
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder={
                          selectedQuestionType === "R-MHDG"
                            ? "e.g. Paragraph A"
                            : selectedQuestionType === "R-MCQ"
                            ? "e.g. Why did the company reduce working hours?"
                            : "e.g. The experiment lasted for ______."
                        } 
                        className="w-full text-xs font-semibold px-3.5 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-none focus:border-indigo-400 text-black placeholder:text-gray-400 resize-none"
                      />
                      {["R-SCOMP", "R-SCO", "R-SCWO", "R-NCOMP", "R-FLOW", "R-DIAG"].includes(selectedQuestionType) && (
                        <p className="text-[10px] text-gray-400 font-semibold">Note: Write double underscores (____) to represent blanks inline if not using a template paragraph.</p>
                      )}
                    </div>

                    {/* MCQ Options Choices */}
                    {selectedQuestionType === "R-MCQ" && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block">Multiple Choice Options</label>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <FormatInput 
                            inputRef={mcqOptARef}
                            value={mcqOptA}
                            onChange={setMcqOptA}
                            placeholder="Option A text"
                            required
                          />
                          <FormatInput 
                            inputRef={mcqOptBRef}
                            value={mcqOptB}
                            onChange={setMcqOptB}
                            placeholder="Option B text"
                            required
                          />
                          <FormatInput 
                            inputRef={mcqOptCRef}
                            value={mcqOptC}
                            onChange={setMcqOptC}
                            placeholder="Option C text"
                            required
                          />
                          <FormatInput 
                            inputRef={mcqOptDRef}
                            value={mcqOptD}
                            onChange={setMcqOptD}
                            placeholder="Option D text"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {/* Correct Answer & Explanation */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block font-bold">Correct Answer Value <span className="text-rose-500">*</span></label>
                        {selectedQuestionType === "R-MCQ" ? (
                          <select 
                            value={correctAnswer}
                            onChange={(e) => setCorrectAnswer(e.target.value)}
                            className="w-full text-xs font-semibold px-2 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-none text-black"
                            required
                          >
                            <option value="">-- Choose Option Letter --</option>
                            <option value="A">Option A</option>
                            <option value="B">Option B</option>
                            <option value="C">Option C</option>
                            <option value="D">Option D</option>
                          </select>
                        ) : selectedQuestionType === "R-TFN" ? (
                          <select 
                            value={correctAnswer}
                            onChange={(e) => setCorrectAnswer(e.target.value)}
                            className="w-full text-xs font-semibold px-2 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-none text-black"
                            required
                          >
                            <option value="">-- Select Answer --</option>
                            <option value="TRUE">TRUE</option>
                            <option value="FALSE">FALSE</option>
                            <option value="NOT GIVEN">NOT GIVEN</option>
                          </select>
                        ) : selectedQuestionType === "R-YNN" ? (
                          <select 
                            value={correctAnswer}
                            onChange={(e) => setCorrectAnswer(e.target.value)}
                            className="w-full text-xs font-semibold px-2 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-none text-black"
                            required
                          >
                            <option value="">-- Select Answer --</option>
                            <option value="YES">YES</option>
                            <option value="NO">NO</option>
                            <option value="NOT GIVEN">NOT GIVEN</option>
                          </select>
                        ) : (["R-MHDG", "R-MINF", "R-MFT", "R-MSE", "R-SCO"].includes(selectedQuestionType) || (selectedQuestionType === "R-SCOMP" && scompMode === "WITH_CLUES")) && groupOptions.trim() ? (
                          <select 
                            value={correctAnswer}
                            onChange={(e) => setCorrectAnswer(e.target.value)}
                            className="w-full text-xs font-semibold px-2 py-2 border border-indigo-100 rounded-lg bg-white focus:outline-none text-black"
                            required
                          >
                            <option value="">-- Select Option --</option>
                            {groupOptions.split("\n").map(o => o.trim()).filter(Boolean).map((opt, idx) => (
                              <option key={idx} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <FormatInput 
                            inputRef={answerInputRef}
                            value={correctAnswer}
                            onChange={setCorrectAnswer}
                            placeholder="e.g. shade / 1990s"
                            required
                          />
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block">Answer Explanation (Optional)</label>
                        <FormatInput 
                          inputRef={explanationRef}
                          value={questionExplanation}
                          onChange={setQuestionExplanation}
                          placeholder="e.g. Para 3 mentions stepwells provided shade during dry seasons."
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all duration-200 shadow-md shadow-indigo-100 flex items-center justify-center gap-2 py-2 rounded-lg text-xs"
                    >
                      <IconPlus size={16} /> Append to Passage {activePassage} Questions
                    </Button>

                  </form>
                ) : (
                  <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <p className="text-xs text-gray-500 font-semibold">Select a standardized IELTS question pattern above to add to Passage {activePassage}.</p>
                  </div>
                )}

              </CardContent>
            </Card>

          </div>

          {/* Right Columns (4): 40 Questions Tracker & Passages Preview */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Real 40 Questions Tracker Card */}
            <Card className="bg-white border-gray-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-50/40 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
              
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="font-bold text-black text-base flex items-center justify-between">
                  <span>IELTS Exam Overview</span>
                  <span className="text-[10px] font-black tracking-widest uppercase bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                    {compiledQuestions.length} / 40 Qs
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-gray-400 font-medium">Monitoring standard IELTS Academic questions counts across the 3 passages.</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-4">
                
                {/* IELTS Questions Progress Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-gray-500">IELTS Target Limit</span>
                    <span className="text-indigo-600 font-black">{Math.round((compiledQuestions.length / 40) * 100)}% Complete</span>
                  </div>
                  <Progress 
                    value={Math.min((compiledQuestions.length / 40) * 100, 100)} 
                    className="h-2 bg-gray-100 [&>div]:bg-indigo-600 shadow-inner"
                  />
                  {compiledQuestions.length !== 40 && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg border border-amber-100 mt-1 animate-pulse">
                      <IconInfoCircle size={14} className="shrink-0" />
                      <span>Note: IELTS Academic standard expects exactly 40 questions.</span>
                    </div>
                  )}
                </div>

                {/* Collapsible Passages Summary & Questions list */}
                <div className="space-y-4">
                  
                  {([1, 2, 3] as const).slice(0, passageCount).map((passIdx) => {
                    const passQs = compiledQuestions.filter(q => q.passageIndex === passIdx)
                    const title = passages[passIdx].title || `Passage ${passIdx} Title (Not Drafted)`
                    const isDrafted = passages[passIdx].title !== ''
                    
                    return (
                      <div key={passIdx} className="space-y-2 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <div className="min-w-0">
                            <span className="text-[8px] font-black uppercase tracking-wider text-gray-400 block">Passage {passIdx}</span>
                            <span className={`font-extrabold text-xs block truncate ${
                              isDrafted ? 'text-black' : 'text-gray-400 italic'
                            }`}>
                              {title}
                            </span>
                          </div>
                          <span className="text-[10px] font-black bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full shrink-0">
                            {passQs.length} Qs
                          </span>
                        </div>

                        {passQs.length > 0 ? (
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                            {passQs.map((q) => (
                              <div key={q.id} className="p-2 bg-white border border-gray-100 rounded-lg hover:border-indigo-100 flex justify-between items-start gap-2 relative group animate-fadeIn">
                                <div className="flex items-start gap-1.5 min-w-0">
                                  <span className="h-4 w-4 bg-indigo-50 text-indigo-600 rounded-full font-bold text-[8px] flex items-center justify-center shrink-0 mt-0.5">
                                    {q.questionNumber}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="font-extrabold text-[10px] text-gray-900 truncate leading-snug">{q.text || `Table Completion Group`}</p>
                                    <p className="text-[8px] font-bold text-gray-400 mt-0.2">Type: {q.type.split("Questions")[0]} • Ans: {q.correctAnswer}</p>
                                  </div>
                                </div>
                                <Button 
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-500 p-0.5 opacity-0 group-hover:opacity-100 hover:bg-transparent h-5 w-5 transition-opacity"
                                >
                                  <IconTrash size={10} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[9px] text-gray-400 italic text-center py-2">No questions added yet for this passage.</p>
                        )}
                      </div>
                    )
                  })}

                </div>

                {/* Final Mock Paper Submit */}
                <div className="mt-5 space-y-2">
                  <Button 
                    onClick={handlePublishPaper}
                    disabled={isPublishing || !examTitle || Array.from({ length: passageCount }, (_, i) => i + 1).some(idx => !passages[idx as 1 | 2 | 3].title)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold transition-all duration-200 shadow-md shadow-indigo-100 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm cursor-pointer"
                  >
                    {isPublishing ? (
                      <IconLoader2 size={16} className="animate-spin" />
                    ) : (
                      <IconSparkles size={16} />
                    )}
                    Publish Complete Mock
                  </Button>
                  {(!examTitle || Array.from({ length: passageCount }, (_, i) => i + 1).some(idx => !passages[idx as 1 | 2 | 3].title)) && (
                    <p className="text-[9px] font-bold text-rose-500 text-center uppercase tracking-wider leading-snug">
                      Ensure Exam Title is set and all {passageCount} Passages have a Title before final publishing.
                    </p>
                  )}
                </div>

              </CardContent>
            </Card>

            {/* IELTS Reading Module Rules Panel */}
            <Card className="bg-gradient-to-tr from-indigo-950 to-indigo-900 border-none shadow-md text-white">
              <CardHeader className="pb-2">
                <CardTitle className="font-bold text-sm tracking-wider uppercase text-indigo-300 flex items-center gap-1.5">
                  Reading Exam Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-3 leading-relaxed">
                <div className="border-l-2 border-indigo-500 pl-3">
                  <span className="font-bold text-indigo-200">Standard Sections:</span> An official Reading paper has precisely 3 sections corresponding to Passage 1, Passage 2, and Passage 3.
                </div>
                <div className="border-l-2 border-indigo-500 pl-3">
                  <span className="font-bold text-indigo-200">Question Limits:</span> Passages typically divide the 40 questions as: Passage 1 (13), Passage 2 (13), Passage 3 (14).
                </div>
                <div className="border-l-2 border-indigo-500 pl-3">
                  <span className="font-bold text-indigo-200">Authentic Uploads:</span> Attaching graphs or process diagrams is essential for academic information-matching and diagram-labeling questions.
                </div>
              </CardContent>
            </Card>

          </div>

        </div>
      )}
    </div>
  )
}

export default function TeacherDashboard() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
        <IconLoader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-sm font-semibold text-gray-500">Loading Exam Workspace...</p>
      </div>
    }>
      <TeacherDashboardContent />
    </Suspense>
  )
}
