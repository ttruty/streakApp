import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { chevronBack, chevronForward } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Habit } from 'src/app/services/habit';

@Component({
  selector: 'app-habit-detail-modal',
  templateUrl: './habit-detail-modal.component.html',
  styleUrls: ['./habit-detail-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class HabitDetailModalComponent implements OnInit {
  @Input() habit!: Habit;

  segmentValue: 'week' | 'month' | 'year' = 'month';

  // The date we are currently looking at (starts as Today)
  currentViewDate: Date = new Date();

  // The Title displayed (e.g. "January 2026")
  viewTitle: string = '';

  gridSquares: any[] = [];
  weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // Headers

  constructor(private modalCtrl: ModalController) {
    addIcons({ chevronBack, chevronForward });
  }

  ngOnInit() {
    this.updateView();
  }

  close() {
    this.modalCtrl.dismiss();
  }

  segmentChanged(ev: any) {
    this.segmentValue = ev.detail.value;
    // Reset to today when changing views to avoid confusion
    this.currentViewDate = new Date();
    this.updateView();
  }

  // --- NAVIGATION (Prev/Next) ---
  changeDate(direction: number) {
    const d = new Date(this.currentViewDate);

    if (this.segmentValue === 'week') {
      d.setDate(d.getDate() + (direction * 7));
    } else if (this.segmentValue === 'month') {
      d.setMonth(d.getMonth() + direction);
    } else if (this.segmentValue === 'year') {
      d.setFullYear(d.getFullYear() + direction);
    }

    this.currentViewDate = d;
    this.updateView();
  }

  updateView() {
    if (this.segmentValue === 'week') this.generateWeekGrid();
    else if (this.segmentValue === 'month') this.generateMonthGrid();
    else if (this.segmentValue === 'year') this.generateYearGrid();
  }

  // --- 1. WEEK VIEW LOGIC ---
  generateWeekGrid() {
    // Calculate start of week (Sunday)
    const startOfWeek = new Date(this.currentViewDate);
    const day = startOfWeek.getDay(); // 0 (Sun) to 6 (Sat)
    startOfWeek.setDate(startOfWeek.getDate() - day); // Go back to Sunday

    this.viewTitle = `Week of ${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    this.gridSquares = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      this.pushDayToGrid(d);
    }
  }

  // --- 2. MONTH VIEW LOGIC ---
  generateMonthGrid() {
    const year = this.currentViewDate.getFullYear();
    const month = this.currentViewDate.getMonth();

    this.viewTitle = this.currentViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    this.gridSquares = [];

    // 1. Find out which day of week the 1st is (0-6)
    const firstDay = new Date(year, month, 1);
    const startDayIndex = firstDay.getDay();

    // 2. Add empty placeholders for days before the 1st
    for (let i = 0; i < startDayIndex; i++) {
      this.gridSquares.push({ isEmpty: true });
    }

    // 3. Fill in the days of the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      this.pushDayToGrid(d);
    }
  }

  // --- 3. YEAR VIEW LOGIC ---
  generateYearGrid() {
    const year = this.currentViewDate.getFullYear();
    this.viewTitle = `${year}`;
    this.gridSquares = [];

    const daysInYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;

    // Start Jan 1st
    for (let i = 0; i < daysInYear; i++) {
      const d = new Date(year, 0, 1); // Jan 1
      d.setDate(d.getDate() + i);     // Add days
      this.pushDayToGrid(d, true);    // true = minimal mode (no text)
    }
  }

  // --- HELPER: CHECK STATUS & PUSH ---
  pushDayToGrid(dateObj: Date, isMinimal: boolean = false) {
    const dateStr = dateObj.toDateString();

    // Check if this specific date exists in history
    // (Assuming HabitLog structure: { date: "Fri Jan 30 2026", ... })
    const historyMatch = this.habit.history.some((log: any) => log.date === dateStr);

    // Also check "Today" live status if the date matches today
    const isToday = dateStr === new Date().toDateString();
    const isCompleted = historyMatch || (isToday && this.habit.completed);

    this.gridSquares.push({
      date: dateObj,
      label: isMinimal ? '' : dateObj.getDate(),
      status: isCompleted ? 'completed' : 'missed',
      isToday: isToday
    });
  }
}
