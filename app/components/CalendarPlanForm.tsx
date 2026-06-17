'use client';
import { useState } from 'react';
import { importCalendarPlan } from '../hooks/importCalendarPlan';
import '../../styles/CalendarPlan.css';

interface CalendarPlanFormProps {
  currentDirectionId: number;
  onSave: (data: any) => void;
  onBeforeCreate?: () => Promise<string[]>;
  semesters: number;
}

export function CalendarPlanForm({ currentDirectionId, onSave, onBeforeCreate }: CalendarPlanFormProps) {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [group, setGroup] = useState('');
  const [profile, setProfile] = useState('');
  const [reg, setReg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (e: any) => {
    e.preventDefault();
    if (!title.trim() || !year.trim() || !group.trim() || !profile.trim() || !reg.trim()) {
      alert('Заполните все поля');
      return;
    }
    if (onBeforeCreate) {
      const problematic = await onBeforeCreate();
      if (problematic.length > 0) {
        alert(
          'Невозможно сформировать учебный план. Следующие дисциплины относятся к неактуальным кафедрам:\n' +
            problematic.join('\n')
        );
        return;
      }
    }
    setIsSubmitting(true);

    let semesters = 1;
    try {
			const res = await fetch(`http://localhost:8001/directions/${currentDirectionId}`);
			if (!res.ok) {
				throw new Error(`HTTP ${res.status}: ${res.statusText}`)
			}
			const data = await res.json();
      console.log('CalendarPlanForm: received data:', data)
      semesters = data.semester_count;
    }
    catch (error)
    {
			const errorMsg = error instanceof Error ? error.message : String(error)
			console.error('Failed to load direction:', errorMsg)
    }
    console.log('CalendarPlanForm: submitting form...');
    console.log('CalendarPlanForm data:');
    console.log(`semesters = ${semesters}`);
    console.log({
        title: title,
        academic_year: year,
        group: group,
        profile: profile,
        reg_number: reg,
        start_date: `${year}-09-01`,
        end_date: `${parseInt(year) + 1}-08-31`,
        courses: Array.from({ length: Math.ceil(semesters / 2) }, (_, i) => ({
          course: i + 1,
          weeks: Array(52).fill('')
        }))
    });
    try {
      const defaultCoursesCount = Math.ceil(semesters / 2);
      await onSave({
        title: title,
        academic_year: year,
        group: group,
        profile: profile,
        reg_number: reg,
        start_date: new Date(year, 8, 1).toLocaleDateString("en-CA"),
        end_date: new Date(parseInt(year) + 1, 7, 31).toLocaleDateString("en-CA"),
        courses: Array.from({ length: defaultCoursesCount }, (_, i) => ({
          course: i + 1,
          weeks: Array(52).fill('')
        }))
      });
      console.log('CalendarPlanForm: form submitted successfully');
      setTitle('');
      setYear('');
      setGroup('');
      setProfile('');
      setReg('');
    } catch (error) {
      console.error('CalendarPlanForm: submission error:', error);
      alert('Ошибка при создании плана');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onBeforeCreate) {
      const problematic = await onBeforeCreate();
      if (problematic.length > 0) {
        alert(
          'Невозможно сформировать учебный план. Следующие дисциплины относятся к неактуальным кафедрам:\n' +
            problematic.join('\n')
        );
        e.target.value = '';
        return;
      }
    }

    importCalendarPlan(file, (importedData) => {
      onSave(importedData);
    });
    e.target.value = '';
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        placeholder="Название"
        value={title}
        onChange={e => setTitle(e.target.value)}
        disabled={isSubmitting}
      />
      <input
        placeholder="Учебный год"
        value={year}
        onChange={e => setYear(e.target.value)}
        disabled={isSubmitting}
      />
      <input
        placeholder="Группа"
        value={group}
        onChange={e => setGroup(e.target.value)}
        disabled={isSubmitting}
      />
      <input
        placeholder="Профиль"
        value={profile}
        onChange={e => setProfile(e.target.value)}
        disabled={isSubmitting}
      />
      <input
        placeholder="Рег. №"
        value={reg}
        onChange={e => setReg(e.target.value)}
        disabled={isSubmitting}
      />
      <button
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Создание...' : 'Создать'}
      </button>
      
      <input
        type="file"
        accept=".xlsx"
        id="calendar-plan-import"
        style={{ display: 'none' }}
        onChange={handleImport}
      />
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => document.getElementById('calendar-plan-import')?.click()}
      >
        Импорт
      </button>
    </form>
  );
}