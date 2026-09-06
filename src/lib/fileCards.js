import { BookIcon, QuestionMarkIcon, VideoIcon, GraduationCapIcon } from '../components/ui/tool-icons'

// Shared "study material" card definitions (used on ModulePage for the
// whole module, and on StagePage filtered to one exam stage).
export const FILE_CARDS = [
  { Icon: BookIcon, title: 'Explanation Files', type: 'sharah', color: '#38bdf8' },
  { Icon: QuestionMarkIcon, title: 'Question Files', type: 'questions', color: '#60a5fa' },
  { Icon: VideoIcon, title: 'Lecture Recordings', type: 'lectures', color: '#818cf8' },
  { Icon: GraduationCapIcon, title: 'Course Recordings', type: 'courses', color: '#c084fc' },
]
