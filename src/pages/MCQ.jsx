import { useState } from 'react'

export default function MCQ() {
  // مثال لأسئلة الـ Biochemistry (ممكن نربطها بسوبابيس لاحقاً)
  const questions = [
    {
      id: 1,
      q: "Where does Glycolysis take place?",
      options: ["Mitochondria", "Cytosol", "Nucleus", "Ribosomes"],
      answer: "Cytosol"
    },
    {
      id: 2,
      q: "Which enzyme is the key regulator of Glycolysis?",
      options: ["Hexokinase", "PFK-1", "Pyruvate Kinase", "Aldolase"],
      answer: "PFK-1"
    }
  ]

  const [selected, setSelected] = useState({})
  const [showResult, setShowResult] = useState({})

  const handleSelect = (qId, option) => {
    setSelected({ ...selected, [qId]: option })
    setShowResult({ ...showResult, [qId]: true })
  }

  return (
    <div style={{ padding: 20, direction: 'ltr' }}> {/* الأسئلة غالباً طب بالانجليزي */}
      <h2 style={{ textAlign: 'center', color: '#38bdf8', marginBottom: 30 }}>🧪 Interactive MCQ Bank</h2>
      
      {questions.map((item, index) => (
        <div key={item.id} style={{ background: '#1e293b', padding: 20, borderRadius: 15, marginBottom: 20, border: '1px solid #334155' }}>
          <p style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>{index + 1}. {item.q}</p>
          <div style={{ display: 'grid', gap: 10 }}>
            {item.options.map(opt => {
              const isCorrect = opt === item.answer;
              const isSelected = selected[item.id] === opt;
              let bgColor = '#0f172a';
              if (showResult[item.id]) {
                if (isCorrect) bgColor = '#059669'; // أخضر لو صح
                else if (isSelected) bgColor = '#dc2626'; // أحمر لو غلط
              }

              return (
                <button 
                  key={opt}
                  onClick={() => !showResult[item.id] && handleSelect(item.id, opt)}
                  style={{ 
                    padding: 12, borderRadius: 10, border: '1px solid #334155', 
                    background: bgColor, color: '#fff', textAlign: 'left', cursor: 'pointer'
                  }}
                >
                  {opt}
                </button>
              )
            })}
          </div>
          {showResult[item.id] && (
            <p style={{ marginTop: 10, color: '#94a3b8' }}>Result: {selected[item.id] === item.answer ? "✅ Correct!" : "❌ Wrong Answer"}</p>
          )}
        </div>
      ))}
    </div>
  )
}
