'use client'

import { useEffect, useState, useCallback } from 'react'

type Step = {
  id: string; order: number; type: string; title: string
  content?: string; question?: string; instruction?: string
  options?: string; correctAnswers?: string; multiple: boolean
  explanation?: string; points: number; statsSolved: number; statsAccuracy: number
}
type Lesson = { id: string; title: string; order: number; steps: Step[] }
type Chapter = { id: string; title: string; order: number; lessons: Lesson[] }
type Course = { id: string; title: string; order: number; chapters: Chapter[] }

const S = {
  btn: (variant: 'primary'|'ghost'|'danger' = 'ghost') => ({
    padding: variant === 'primary' ? '8px 18px' : '6px 12px',
    borderRadius: 7, border: variant === 'danger' ? '1px solid #4a1a1a' : '1px solid #2a2a2a',
    background: variant === 'primary' ? '#62a54b' : variant === 'danger' ? '#2a0f0f' : '#1e1e1e',
    color: variant === 'primary' ? '#fff' : variant === 'danger' ? '#f87171' : '#aaa',
    cursor: 'pointer', fontSize: 13, fontWeight: variant === 'primary' ? 600 : 400
  }),
  input: { padding:'8px 12px', borderRadius:7, border:'1px solid #2a2a2a', background:'#0f0f0f', color:'#e0e0e0', fontSize:13, width:'100%', boxSizing:'border-box' as const },
  textarea: (rows=4) => ({ padding:'8px 12px', borderRadius:7, border:'1px solid #2a2a2a', background:'#0f0f0f', color:'#e0e0e0', fontSize:12, width:'100%', boxSizing:'border-box' as const, fontFamily:'monospace', resize:'vertical' as const, minHeight: rows*22 }),
  label: { fontSize:11, color:'#666', marginBottom:4, display:'block', textTransform:'uppercase' as const, letterSpacing:'0.06em' },
}

// ── Step Preview Modal ──────────────────────────────────────────────
function StepPreview({ step, onClose }: { step: Step; onClose: () => void }) {
  const options = step.options ? JSON.parse(step.options) : []
  const correct: number[] = step.correctAnswers ? JSON.parse(step.correctAnswers) : []

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#111', border:'1px solid #2a2a2a', borderRadius:14, width:'100%', maxWidth:680, maxHeight:'88vh', overflow:'auto', padding:32 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <span style={{ fontSize:12, color:'#555', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>
            {step.type === 'theory' ? '📖 Предпросмотр — Теория' : '❓ Предпросмотр — Квиз'}
          </span>
          <button onClick={onClose} style={{ ...S.btn('ghost'), fontSize:18, padding:'4px 10px' }}>✕</button>
        </div>

        <h2 style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:20 }}>{step.title}</h2>

        {step.type === 'theory' && (
          <div style={{ color:'#ccc', fontSize:14, lineHeight:1.8 }}
            dangerouslySetInnerHTML={{ __html: step.content || '<p style="color:#555">Контент не заполнен</p>' }} />
        )}

        {step.type === 'quiz' && (<>
          <p style={{ color:'#ddd', fontSize:15, marginBottom:8 }}>{step.question}</p>
          <p style={{ color:'#666', fontSize:12, marginBottom:16 }}>{step.instruction || 'Выберите один вариант из списка'}</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {options.map((opt: string, i: number) => (
              <div key={i} style={{
                padding:'10px 14px', borderRadius:8,
                border: correct.includes(i) ? '1px solid #62a54b' : '1px solid #2a2a2a',
                background: correct.includes(i) ? '#0d1f0d' : '#161616',
                color: correct.includes(i) ? '#62a54b' : '#bbb',
                fontSize:13, display:'flex', alignItems:'center', gap:10,
              }}>
                <span style={{ width:20, height:20, borderRadius:'50%', border:`1px solid ${correct.includes(i)?'#62a54b':'#444'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, flexShrink:0, color: correct.includes(i)?'#62a54b':'#555' }}>
                  {correct.includes(i) ? '✓' : ''}
                </span>
                {opt || <span style={{ color:'#444' }}>Пустой вариант</span>}
              </div>
            ))}
          </div>
          {step.explanation && (
            <div style={{ marginTop:20, padding:'12px 16px', background:'#161616', borderRadius:8, border:'1px solid #2a2a2a' }}>
              <div style={{ fontSize:11, color:'#555', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Подсказка</div>
              <div style={{ color:'#888', fontSize:13 }}>{step.explanation}</div>
            </div>
          )}
        </>)}
      </div>
    </div>
  )
}

function StepEditor({ step, onSave, onDelete, onClose }: {
  step: Step; onSave: (s: Step) => void; onDelete: () => void; onClose: () => void
}) {
  const [form, setForm] = useState({ ...step,
    options: step.options ? JSON.parse(step.options) : ['', '', '', ''],
    correctAnswers: step.correctAnswers ? JSON.parse(step.correctAnswers) : [],
  })
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

  const save = async () => {
    setSaving(true)
    const payload = { ...form,
      options: form.type === 'quiz' ? form.options : undefined,
      correctAnswers: form.type === 'quiz' ? form.correctAnswers : undefined,
    }
    const r = await fetch(`/api/admin/steps/${step.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const updated = await r.json()
    setSaving(false)
    onSave(updated)
  }

  const toggleCorrect = (i: number) => {
    const cur: number[] = form.correctAnswers
    if (form.multiple) {
      set('correctAnswers', cur.includes(i) ? cur.filter(x => x !== i) : [...cur, i])
    } else {
      set('correctAnswers', [i])
    }
  }

  // Build preview step from current form state
  const previewStep: Step = {
    ...step,
    title: form.title,
    content: form.content,
    question: form.question,
    instruction: form.instruction,
    explanation: form.explanation,
    options: form.type === 'quiz' ? JSON.stringify(form.options) : undefined,
    correctAnswers: form.type === 'quiz' ? JSON.stringify(form.correctAnswers) : undefined,
    multiple: form.multiple,
    points: form.points,
  }

  return (
    <>
      {previewing && <StepPreview step={previewStep} onClose={() => setPreviewing(false)} />}
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
        <div style={{ background:'#161616', border:'1px solid #2a2a2a', borderRadius:14, width:'100%', maxWidth:720, maxHeight:'90vh', overflow:'auto', padding:28 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h2 style={{ fontSize:17, fontWeight:700, color:'#fff', margin:0 }}>
              {step.type === 'theory' ? '📖 Теория' : '❓ Квиз'} — редактор шага
            </h2>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setPreviewing(true)} style={{ ...S.btn('ghost'), fontSize:13 }}>👁 Предпросмотр</button>
              <button onClick={onClose} style={{ ...S.btn('ghost'), fontSize:18, padding:'4px 10px' }}>✕</button>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label style={S.label}>Заголовок шага</label>
              <input style={S.input} value={form.title} onChange={e => set('title', e.target.value)} />
            </div>

            {form.type === 'theory' && (
              <div>
                <label style={S.label}>Контент (HTML)</label>
                <textarea style={S.textarea(12)} value={form.content || ''} onChange={e => set('content', e.target.value)} />
              </div>
            )}

            {form.type === 'quiz' && (<>
              <div>
                <label style={S.label}>Вопрос</label>
                <textarea style={S.textarea(3)} value={form.question || ''} onChange={e => set('question', e.target.value)} />
              </div>

              <div style={{ display:'flex', gap:16 }}>
                <div style={{ flex:1 }}>
                  <label style={S.label}>Инструкция</label>
                  <input style={S.input} value={form.instruction || ''} onChange={e => set('instruction', e.target.value)}
                    placeholder="Выберите один вариант из списка" />
                </div>
                <div style={{ width:100 }}>
                  <label style={S.label}>Баллы</label>
                  <input style={S.input} type="number" min={1} max={5} value={form.points}
                    onChange={e => set('points', parseInt(e.target.value))} />
                </div>
              </div>

              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <label style={{ ...S.label, marginBottom:0 }}>Варианты ответов (нажми ✓ чтобы отметить правильный)</label>
                  <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#888', cursor:'pointer' }}>
                    <input type="checkbox" checked={form.multiple} onChange={e => set('multiple', e.target.checked)} />
                    Несколько правильных
                  </label>
                </div>
                {(form.options as string[]).map((opt, i) => (
                  <div key={i} style={{ display:'flex', gap:8, marginBottom:6, alignItems:'center' }}>
                    <button onClick={() => toggleCorrect(i)} title="Отметить правильным" style={{
                      width:28, height:28, borderRadius:6, border:'1px solid #333', flexShrink:0,
                      background: form.correctAnswers.includes(i) ? '#1e3a1e' : '#1e1e1e',
                      color: form.correctAnswers.includes(i) ? '#62a54b' : '#555',
                      cursor:'pointer', fontSize:14
                    }}>✓</button>
                    <input style={S.input} value={opt}
                      onChange={e => { const o = [...form.options]; o[i] = e.target.value; set('options', o) }}
                      placeholder={`Вариант ${i+1}`} />
                    <button onClick={() => { const o = (form.options as string[]).filter((_,j)=>j!==i); set('options', o); set('correctAnswers', form.correctAnswers.filter((x:number)=>x!==i).map((x:number)=>x>i?x-1:x)) }}
                      style={{ ...S.btn('danger'), padding:'6px 8px', flexShrink:0 }}>✕</button>
                  </div>
                ))}
                <button onClick={() => set('options', [...form.options, ''])} style={{ ...S.btn(), marginTop:4, fontSize:12 }}>
                  + Добавить вариант
                </button>
              </div>

              <div>
                <label style={S.label}>Подсказка (показывается после неверного ответа)</label>
                <textarea style={S.textarea(4)} value={form.explanation || ''}
                  onChange={e => set('explanation', e.target.value)}
                  placeholder="Объяснение правильного ответа..." />
              </div>
            </>)}
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', marginTop:24, paddingTop:20, borderTop:'1px solid #2a2a2a' }}>
            <button onClick={() => { if(confirm('Удалить шаг?')) onDelete() }} style={S.btn('danger')}>
              🗑 Удалить шаг
            </button>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={onClose} style={S.btn()}>Отмена</button>
              <button onClick={save} disabled={saving} style={S.btn('primary')}>
                {saving ? 'Сохранение...' : '✓ Сохранить'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function AddStepModal({ lessonId, onAdd, onClose }: { lessonId: string; onAdd: () => void; onClose: () => void }) {
  const [type, setType] = useState<'theory'|'quiz'>('theory')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!title.trim()) return
    setSaving(true)
    await fetch('/api/admin/steps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, type, title,
        instruction: type === 'quiz' ? 'Выберите один вариант из списка' : undefined,
        options: type === 'quiz' ? ['', '', '', ''] : undefined,
        correctAnswers: type === 'quiz' ? [] : undefined,
        content: type === 'theory' ? '<p>Введите контент...</p>' : undefined,
      })
    })
    setSaving(false)
    onAdd()
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#161616', border:'1px solid #2a2a2a', borderRadius:14, width:440, padding:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:20 }}>Добавить шаг</h2>
        <div style={{ marginBottom:14 }}>
          <label style={S.label}>Тип шага</label>
          <div style={{ display:'flex', gap:8 }}>
            {(['theory','quiz'] as const).map(t => (
              <button key={t} onClick={() => setType(t)} style={{
                ...S.btn(type===t?'primary':'ghost'), flex:1, textAlign:'center'
              }}>
                {t === 'theory' ? '📖 Теория' : '❓ Квиз'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={S.label}>Заголовок</label>
          <input style={S.input} value={title} onChange={e => setTitle(e.target.value)}
            placeholder={type === 'theory' ? 'Название темы' : 'Вопрос №...'} autoFocus />
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btn()}>Отмена</button>
          <button onClick={save} disabled={saving || !title.trim()} style={S.btn('primary')}>
            {saving ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddLessonModal({ chapterId, onAdd, onClose }: { chapterId: string; onAdd: () => void; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!title.trim()) return
    setSaving(true)
    await fetch('/api/admin/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId, title, id: `lesson_${Date.now()}` })
    })
    setSaving(false)
    onAdd()
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#161616', border:'1px solid #2a2a2a', borderRadius:14, width:440, padding:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:20 }}>Добавить урок</h2>
        <div style={{ marginBottom:20 }}>
          <label style={S.label}>Название урока</label>
          <input style={S.input} value={title} onChange={e => setTitle(e.target.value)}
            placeholder="1.5 Название темы" autoFocus
            onKeyDown={e => e.key === 'Enter' && save()} />
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btn()}>Отмена</button>
          <button onClick={save} disabled={saving || !title.trim()} style={S.btn('primary')}>
            {saving ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCourseEditor() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCourse, setActiveCourse] = useState<string>('basic')
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [editStep, setEditStep] = useState<Step | null>(null)
  const [addingStep, setAddingStep] = useState(false)
  const [addingLesson, setAddingLesson] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/courses').then(r => r.json()).then(data => {
      setCourses(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  useEffect(() => { load() }, [load])

  const course = courses.find(c => c.id === activeCourse)

  useEffect(() => {
    if (!activeLesson || !course) return
    for (const ch of course.chapters) {
      const l = ch.lessons.find(l => l.id === activeLesson.id)
      if (l) { setActiveLesson(l); return }
    }
  }, [courses])

  const deleteStep = async (stepId: string) => {
    await fetch(`/api/admin/steps/${stepId}`, { method: 'DELETE' })
    setEditStep(null)
    load()
  }

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('Удалить урок и все его шаги?')) return
    await fetch(`/api/admin/lessons/${lessonId}`, { method: 'DELETE' })
    if (activeLesson?.id === lessonId) setActiveLesson(null)
    load()
  }

  const stepIcon = (type: string) => type === 'quiz' ? '❓' : type === 'practice' ? '🔧' : '📖'

  if (loading) return <div style={{ padding:40, color:'#666' }}>Загрузка курсов...</div>

  if (courses.length === 0) {
    return (
      <div style={{ padding:40 }}>
        <div style={{ background:'#161616', border:'1px solid #2a2a2a', borderRadius:12, padding:32, maxWidth:520 }}>
          <h2 style={{ color:'#fff', marginBottom:12 }}>База данных пуста</h2>
          <p style={{ color:'#888', fontSize:14, lineHeight:1.6, marginBottom:20 }}>
            Контент курса ещё не импортирован из main.js в базу данных.<br/>
            Выполни команду локально:
          </p>
          <pre style={{ background:'#0f0f0f', padding:'12px 16px', borderRadius:8, fontSize:13, color:'#62a54b', overflow:'auto' }}>
{`npm install
node prisma/seed.mjs`}
          </pre>
          <p style={{ color:'#555', fontSize:12, marginTop:12 }}>После этого обнови страницу.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', height:'100%' }}>
      {/* Course/Lesson tree */}
      <div style={{ width:280, borderRight:'1px solid #1e1e1e', overflow:'auto', flexShrink:0 }}>
        {/* Course tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid #1e1e1e' }}>
          {courses.map(c => (
            <button key={c.id} onClick={() => { setActiveCourse(c.id); setActiveLesson(null) }} style={{
              flex:1, padding:'10px 6px', border:'none', cursor:'pointer', fontSize:11, fontWeight:600,
              background: activeCourse===c.id ? '#1e3a1e' : 'transparent',
              color: activeCourse===c.id ? '#62a54b' : '#666',
              borderBottom: activeCourse===c.id ? '2px solid #62a54b' : '2px solid transparent',
            }}>
              {c.id === 'basic' ? 'Базовый' : c.id === 'advanced' ? 'Продвинутый' : 'Финальный'}
            </button>
          ))}
        </div>

        {/* Lesson tree */}
        <div style={{ padding:'8px 0' }}>
          {course?.chapters.map(ch => (
            <div key={ch.id}>
              <div style={{ padding:'8px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11, color:'#555', fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.06em' }}>
                  {ch.title}
                </span>
                <button onClick={() => setAddingLesson(ch.id)} style={{
                  background:'transparent', border:'none', color:'#555', cursor:'pointer',
                  fontSize:18, lineHeight:1, padding:'0 4px', borderRadius:4,
                }} title="Добавить урок">+</button>
              </div>
              {ch.lessons.map(lesson => (
                <div key={lesson.id} style={{
                  display:'flex', alignItems:'center',
                  background: activeLesson?.id===lesson.id ? '#1a2a1a' : 'transparent',
                  borderLeft: activeLesson?.id===lesson.id ? '2px solid #62a54b' : '2px solid transparent',
                }}>
                  <button onClick={() => setActiveLesson(lesson)} style={{
                    flex:1, textAlign:'left', padding:'8px 8px 8px 20px',
                    background:'transparent', border:'none', cursor:'pointer', fontSize:13,
                    color: activeLesson?.id===lesson.id ? '#62a54b' : '#bbb',
                  }}>
                    {lesson.title}
                    <span style={{ marginLeft:6, fontSize:10, color:'#555' }}>({lesson.steps.length})</span>
                  </button>
                  <button onClick={() => deleteLesson(lesson.id)} style={{
                    background:'transparent', border:'none', color:'#3a1a1a', cursor:'pointer',
                    fontSize:13, padding:'4px 8px', flexShrink:0, borderRadius:4,
                    transition:'color 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#f87171'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='#3a1a1a'}
                    title="Удалить урок">🗑</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Step list */}
      <div style={{ flex:1, overflow:'auto', padding:28 }}>
        {!activeLesson ? (
          <div style={{ color:'#555', paddingTop:60, textAlign:'center', fontSize:14 }}>
            Выбери урок слева
          </div>
        ) : (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
              <div>
                <h2 style={{ fontSize:18, fontWeight:700, color:'#fff', margin:0 }}>{activeLesson.title}</h2>
                <p style={{ color:'#555', fontSize:13, marginTop:4 }}>{activeLesson.steps.length} шагов</p>
              </div>
              <button onClick={() => setAddingStep(true)} style={S.btn('primary')}>
                + Добавить шаг
              </button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {activeLesson.steps.map((step, i) => (
                <div key={step.id} style={{
                  background:'#161616', border:'1px solid #222', borderRadius:10, padding:'12px 16px',
                  display:'flex', alignItems:'center', gap:12,
                  transition:'border-color 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor='#3a3a3a'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor='#222'}
                >
                  <span style={{ color:'#666', fontSize:11, width:20, textAlign:'center', flexShrink:0 }}>{i+1}</span>
                  <span style={{ fontSize:16, flexShrink:0 }}>{stepIcon(step.type)}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ color:'#e0e0e0', fontSize:13, fontWeight:500 }}>{step.title}</div>
                    {step.type === 'quiz' && step.question && (
                      <div style={{ color:'#555', fontSize:11, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:400 }}>
                        {step.question}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize:11, padding:'2px 8px', borderRadius:12,
                    background: step.type==='quiz' ? '#1a1a2e' : step.type==='practice' ? '#1a2a1a' : '#1e1e1e',
                    color: step.type==='quiz' ? '#667eea' : step.type==='practice' ? '#62a54b' : '#666',
                  }}>
                    {step.type}
                  </span>
                  {/* Preview button */}
                  <button onClick={() => setEditStep({ ...step, _preview: true } as any)} style={{
                    background:'transparent', border:'1px solid #2a2a2a', borderRadius:6,
                    color:'#666', cursor:'pointer', fontSize:12, padding:'4px 8px',
                  }} title="Предпросмотр">👁</button>
                  {/* Edit button */}
                  {step.type !== 'practice' && (
                    <button onClick={() => setEditStep(step)} style={{
                      background:'transparent', border:'1px solid #2a2a2a', borderRadius:6,
                      color:'#666', cursor:'pointer', fontSize:12, padding:'4px 8px',
                    }} title="Редактировать">✏️</button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Step editor modal */}
      {editStep && !(editStep as any)._preview && (
        <StepEditor
          step={editStep}
          onSave={() => { setEditStep(null); load() }}
          onDelete={() => deleteStep(editStep.id)}
          onClose={() => setEditStep(null)}
        />
      )}

      {/* Step preview modal */}
      {editStep && (editStep as any)._preview && (
        <StepPreview
          step={editStep}
          onClose={() => setEditStep(null)}
        />
      )}

      {/* Add step modal */}
      {addingStep && activeLesson && (
        <AddStepModal
          lessonId={activeLesson.id}
          onAdd={load}
          onClose={() => setAddingStep(false)}
        />
      )}

      {/* Add lesson modal */}
      {addingLesson && (
        <AddLessonModal
          chapterId={addingLesson}
          onAdd={load}
          onClose={() => setAddingLesson(null)}
        />
      )}
    </div>
  )
}


const S = { // styles
  btn: (variant: 'primary'|'ghost'|'danger' = 'ghost') => ({
    padding: variant === 'primary' ? '8px 18px' : '6px 12px',
    borderRadius: 7, border: variant === 'danger' ? '1px solid #4a1a1a' : '1px solid #2a2a2a',
    background: variant === 'primary' ? '#62a54b' : variant === 'danger' ? '#2a0f0f' : '#1e1e1e',
    color: variant === 'primary' ? '#fff' : variant === 'danger' ? '#f87171' : '#aaa',
    cursor: 'pointer', fontSize: 13, fontWeight: variant === 'primary' ? 600 : 400
  }),
  input: { padding:'8px 12px', borderRadius:7, border:'1px solid #2a2a2a', background:'#0f0f0f', color:'#e0e0e0', fontSize:13, width:'100%', boxSizing:'border-box' as const },
  textarea: (rows=4) => ({ padding:'8px 12px', borderRadius:7, border:'1px solid #2a2a2a', background:'#0f0f0f', color:'#e0e0e0', fontSize:12, width:'100%', boxSizing:'border-box' as const, fontFamily:'monospace', resize:'vertical' as const, minHeight: rows*22 }),
  label: { fontSize:11, color:'#666', marginBottom:4, display:'block', textTransform:'uppercase' as const, letterSpacing:'0.06em' },
}

function StepEditor({ step, onSave, onDelete, onClose }: {
  step: Step; onSave: (s: Step) => void; onDelete: () => void; onClose: () => void
}) {
  const [form, setForm] = useState({ ...step,
    options: step.options ? JSON.parse(step.options) : ['', '', '', ''],
    correctAnswers: step.correctAnswers ? JSON.parse(step.correctAnswers) : [],
  })
  const [saving, setSaving] = useState(false)

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

  const save = async () => {
    setSaving(true)
    const payload = { ...form,
      options: form.type === 'quiz' ? form.options : undefined,
      correctAnswers: form.type === 'quiz' ? form.correctAnswers : undefined,
    }
    const r = await fetch(`/api/admin/steps/${step.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const updated = await r.json()
    setSaving(false)
    onSave(updated)
  }

  const toggleCorrect = (i: number) => {
    const cur: number[] = form.correctAnswers
    if (form.multiple) {
      set('correctAnswers', cur.includes(i) ? cur.filter(x => x !== i) : [...cur, i])
    } else {
      set('correctAnswers', [i])
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#161616', border:'1px solid #2a2a2a', borderRadius:14, width:'100%', maxWidth:720, maxHeight:'90vh', overflow:'auto', padding:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:17, fontWeight:700, color:'#fff', margin:0 }}>
            {step.type === 'theory' ? '📖 Теория' : '❓ Квиз'} — редактор шага
          </h2>
          <button onClick={onClose} style={{ ...S.btn('ghost'), fontSize:18, padding:'4px 10px' }}>✕</button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Title */}
          <div>
            <label style={S.label}>Заголовок шага</label>
            <input style={S.input} value={form.title} onChange={e => set('title', e.target.value)} />
          </div>

          {form.type === 'theory' && (
            <div>
              <label style={S.label}>Контент (HTML)</label>
              <textarea style={S.textarea(12)} value={form.content || ''} onChange={e => set('content', e.target.value)} />
            </div>
          )}

          {form.type === 'quiz' && (<>
            <div>
              <label style={S.label}>Вопрос</label>
              <textarea style={S.textarea(3)} value={form.question || ''} onChange={e => set('question', e.target.value)} />
            </div>

            <div style={{ display:'flex', gap:16 }}>
              <div style={{ flex:1 }}>
                <label style={S.label}>Инструкция</label>
                <input style={S.input} value={form.instruction || ''} onChange={e => set('instruction', e.target.value)}
                  placeholder="Выберите один вариант из списка" />
              </div>
              <div style={{ width:100 }}>
                <label style={S.label}>Баллы</label>
                <input style={S.input} type="number" min={1} max={5} value={form.points}
                  onChange={e => set('points', parseInt(e.target.value))} />
              </div>
            </div>

            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <label style={{ ...S.label, marginBottom:0 }}>Варианты ответов (нажми ✓ чтобы отметить правильный)</label>
                <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#888', cursor:'pointer' }}>
                  <input type="checkbox" checked={form.multiple} onChange={e => set('multiple', e.target.checked)} />
                  Несколько правильных
                </label>
              </div>
              {(form.options as string[]).map((opt, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:6, alignItems:'center' }}>
                  <button onClick={() => toggleCorrect(i)} title="Отметить правильным" style={{
                    width:28, height:28, borderRadius:6, border:'1px solid #333', flexShrink:0,
                    background: form.correctAnswers.includes(i) ? '#1e3a1e' : '#1e1e1e',
                    color: form.correctAnswers.includes(i) ? '#62a54b' : '#555',
                    cursor:'pointer', fontSize:14
                  }}>✓</button>
                  <input style={S.input} value={opt}
                    onChange={e => { const o = [...form.options]; o[i] = e.target.value; set('options', o) }}
                    placeholder={`Вариант ${i+1}`} />
                  <button onClick={() => { const o = (form.options as string[]).filter((_,j)=>j!==i); set('options', o); set('correctAnswers', form.correctAnswers.filter((x:number)=>x!==i).map((x:number)=>x>i?x-1:x)) }}
                    style={{ ...S.btn('danger'), padding:'6px 8px', flexShrink:0 }}>✕</button>
                </div>
              ))}
              <button onClick={() => set('options', [...form.options, ''])} style={{ ...S.btn(), marginTop:4, fontSize:12 }}>
                + Добавить вариант
              </button>
            </div>

            <div>
              <label style={S.label}>Подсказка (показывается после неверного ответа)</label>
              <textarea style={S.textarea(4)} value={form.explanation || ''}
                onChange={e => set('explanation', e.target.value)}
                placeholder="Объяснение правильного ответа..." />
            </div>
          </>)}
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', marginTop:24, paddingTop:20, borderTop:'1px solid #2a2a2a' }}>
          <button onClick={() => { if(confirm('Удалить шаг?')) onDelete() }} style={S.btn('danger')}>
            🗑 Удалить шаг
          </button>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} style={S.btn()}>Отмена</button>
            <button onClick={save} disabled={saving} style={S.btn('primary')}>
              {saving ? 'Сохранение...' : '✓ Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AddStepModal({ lessonId, onAdd, onClose }: { lessonId: string; onAdd: () => void; onClose: () => void }) {
  const [type, setType] = useState<'theory'|'quiz'>('theory')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!title.trim()) return
    setSaving(true)
    await fetch('/api/admin/steps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, type, title,
        instruction: type === 'quiz' ? 'Выберите один вариант из списка' : undefined,
        options: type === 'quiz' ? ['', '', '', ''] : undefined,
        correctAnswers: type === 'quiz' ? [] : undefined,
        content: type === 'theory' ? '<p>Введите контент...</p>' : undefined,
      })
    })
    setSaving(false)
    onAdd()
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#161616', border:'1px solid #2a2a2a', borderRadius:14, width:440, padding:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:20 }}>Добавить шаг</h2>
        <div style={{ marginBottom:14 }}>
          <label style={S.label}>Тип шага</label>
          <div style={{ display:'flex', gap:8 }}>
            {(['theory','quiz'] as const).map(t => (
              <button key={t} onClick={() => setType(t)} style={{
                ...S.btn(type===t?'primary':'ghost'), flex:1, textAlign:'center'
              }}>
                {t === 'theory' ? '📖 Теория' : '❓ Квиз'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={S.label}>Заголовок</label>
          <input style={S.input} value={title} onChange={e => setTitle(e.target.value)}
            placeholder={type === 'theory' ? 'Название темы' : 'Вопрос №...'} autoFocus />
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btn()}>Отмена</button>
          <button onClick={save} disabled={saving || !title.trim()} style={S.btn('primary')}>
            {saving ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddLessonModal({ chapterId, onAdd, onClose }: { chapterId: string; onAdd: () => void; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!title.trim()) return
    setSaving(true)
    await fetch('/api/admin/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId, title, id: `lesson_${Date.now()}` })
    })
    setSaving(false)
    onAdd()
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#161616', border:'1px solid #2a2a2a', borderRadius:14, width:440, padding:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:20 }}>Добавить урок</h2>
        <div style={{ marginBottom:20 }}>
          <label style={S.label}>Название урока</label>
          <input style={S.input} value={title} onChange={e => setTitle(e.target.value)}
            placeholder="1.5 Название темы" autoFocus
            onKeyDown={e => e.key === 'Enter' && save()} />
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={S.btn()}>Отмена</button>
          <button onClick={save} disabled={saving || !title.trim()} style={S.btn('primary')}>
            {saving ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCourseEditor() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCourse, setActiveCourse] = useState<string>('basic')
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [editStep, setEditStep] = useState<Step | null>(null)
  const [addingStep, setAddingStep] = useState(false)
  const [addingLesson, setAddingLesson] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/courses').then(r => r.json()).then(data => {
      setCourses(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  useEffect(() => { load() }, [load])

  const course = courses.find(c => c.id === activeCourse)

  // Keep activeLesson in sync after reload
  useEffect(() => {
    if (!activeLesson || !course) return
    for (const ch of course.chapters) {
      const l = ch.lessons.find(l => l.id === activeLesson.id)
      if (l) { setActiveLesson(l); return }
    }
  }, [courses])

  const deleteStep = async (stepId: string) => {
    await fetch(`/api/admin/steps/${stepId}`, { method: 'DELETE' })
    setEditStep(null)
    load()
  }

  const stepIcon = (type: string) => type === 'quiz' ? '❓' : type === 'practice' ? '🔧' : '📖'

  if (loading) return <div style={{ padding:40, color:'#666' }}>Загрузка курсов...</div>

  if (courses.length === 0) {
    return (
      <div style={{ padding:40 }}>
        <div style={{ background:'#161616', border:'1px solid #2a2a2a', borderRadius:12, padding:32, maxWidth:520 }}>
          <h2 style={{ color:'#fff', marginBottom:12 }}>База данных пуста</h2>
          <p style={{ color:'#888', fontSize:14, lineHeight:1.6, marginBottom:20 }}>
            Контент курса ещё не импортирован из main.js в базу данных.<br/>
            Выполни команду локально:
          </p>
          <pre style={{ background:'#0f0f0f', padding:'12px 16px', borderRadius:8, fontSize:13, color:'#62a54b', overflow:'auto' }}>
{`npm install
node prisma/seed.mjs`}
          </pre>
          <p style={{ color:'#555', fontSize:12, marginTop:12 }}>
            После этого обнови страницу.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', height:'100%' }}>
      {/* Course/Lesson tree */}
      <div style={{ width:280, borderRight:'1px solid #1e1e1e', overflow:'auto', flexShrink:0 }}>
        {/* Course tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid #1e1e1e' }}>
          {courses.map(c => (
            <button key={c.id} onClick={() => { setActiveCourse(c.id); setActiveLesson(null) }} style={{
              flex:1, padding:'10px 6px', border:'none', cursor:'pointer', fontSize:11, fontWeight:600,
              background: activeCourse===c.id ? '#1e3a1e' : 'transparent',
              color: activeCourse===c.id ? '#62a54b' : '#666',
              borderBottom: activeCourse===c.id ? '2px solid #62a54b' : '2px solid transparent',
            }}>
              {c.id === 'basic' ? 'Базовый' : c.id === 'advanced' ? 'Продвинутый' : 'Финальный'}
            </button>
          ))}
        </div>

        {/* Lesson tree */}
        <div style={{ padding:'8px 0' }}>
          {course?.chapters.map(ch => (
            <div key={ch.id}>
              <div style={{ padding:'8px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11, color:'#555', fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.06em' }}>
                  {ch.title}
                </span>
                <button onClick={() => setAddingLesson(ch.id)} style={{
                  background:'transparent', border:'none', color:'#555', cursor:'pointer',
                  fontSize:18, lineHeight:1, padding:'0 4px', borderRadius:4,
                }} title="Добавить урок">+</button>
              </div>
              {ch.lessons.map(lesson => (
                <button key={lesson.id} onClick={() => setActiveLesson(lesson)} style={{
                  width:'100%', textAlign:'left', padding:'8px 14px 8px 20px',
                  background: activeLesson?.id===lesson.id ? '#1a2a1a' : 'transparent',
                  border:'none', cursor:'pointer', fontSize:13,
                  color: activeLesson?.id===lesson.id ? '#62a54b' : '#bbb',
                  borderLeft: activeLesson?.id===lesson.id ? '2px solid #62a54b' : '2px solid transparent',
                }}>
                  {lesson.title}
                  <span style={{ marginLeft:6, fontSize:10, color:'#555' }}>({lesson.steps.length})</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Step list */}
      <div style={{ flex:1, overflow:'auto', padding:28 }}>
        {!activeLesson ? (
          <div style={{ color:'#555', paddingTop:60, textAlign:'center', fontSize:14 }}>
            Выбери урок слева
          </div>
        ) : (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
              <div>
                <h2 style={{ fontSize:18, fontWeight:700, color:'#fff', margin:0 }}>{activeLesson.title}</h2>
                <p style={{ color:'#555', fontSize:13, marginTop:4 }}>{activeLesson.steps.length} шагов</p>
              </div>
              <button onClick={() => setAddingStep(true)} style={S.btn('primary')}>
                + Добавить шаг
              </button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {activeLesson.steps.map((step, i) => (
                <div key={step.id} onClick={() => step.type !== 'practice' && setEditStep(step)} style={{
                  background:'#161616', border:'1px solid #222', borderRadius:10, padding:'12px 16px',
                  cursor: step.type !== 'practice' ? 'pointer' : 'default',
                  display:'flex', alignItems:'center', gap:12,
                  transition:'border-color 0.15s',
                }}
                  onMouseEnter={e => { if(step.type!=='practice')(e.currentTarget as HTMLElement).style.borderColor='#3a3a3a' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='#222' }}
                >
                  <span style={{ color:'#666', fontSize:11, width:20, textAlign:'center', flexShrink:0 }}>{i+1}</span>
                  <span style={{ fontSize:16, flexShrink:0 }}>{stepIcon(step.type)}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ color:'#e0e0e0', fontSize:13, fontWeight:500 }}>{step.title}</div>
                    {step.type === 'quiz' && step.question && (
                      <div style={{ color:'#555', fontSize:11, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:400 }}>
                        {step.question}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize:11, padding:'2px 8px', borderRadius:12,
                    background: step.type==='quiz' ? '#1a1a2e' : step.type==='practice' ? '#1a2a1a' : '#1e1e1e',
                    color: step.type==='quiz' ? '#667eea' : step.type==='practice' ? '#62a54b' : '#666',
                  }}>
                    {step.type}
                  </span>
                  {step.type !== 'practice' && (
                    <span style={{ color:'#444', fontSize:12 }}>✏️</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Step editor modal */}
      {editStep && (
        <StepEditor
          step={editStep}
          onSave={() => { setEditStep(null); load() }}
          onDelete={() => deleteStep(editStep.id)}
          onClose={() => setEditStep(null)}
        />
      )}

      {/* Add step modal */}
      {addingStep && activeLesson && (
        <AddStepModal
          lessonId={activeLesson.id}
          onAdd={load}
          onClose={() => setAddingStep(false)}
        />
      )}

      {/* Add lesson modal */}
      {addingLesson && (
        <AddLessonModal
          chapterId={addingLesson}
          onAdd={load}
          onClose={() => setAddingLesson(null)}
        />
      )}
    </div>
  )
}
