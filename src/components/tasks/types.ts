// Task types, status, en interfaces voor MedDoc Pro takenoverzicht

export type TaskStatus =
  | 'todo'           // Nog te doen
  | 'scheduled'      // Ingepland
  | 'in_progress'    // Bezig
  | 'completed'      // Afgerond
  | 'sent'           // Opgestuurd
  | 'pending'        // Openstaand
  | 'overdue';       // Verlopen

export type TaskType =
  | 'home_visit'           // Huisbezoek inplannen
  | 'intake_appointment'   // Afnemen intake
  | 'intake_processing'    // Verwerken intake
  | 'omaha_intake'         // Afronden Omaha intake
  | 'care_plan'            // Afronden Zorgplan
  | 'care_quantification'  // Afronden Kwantificatie of care
  | 'deel2_completion'     // Afronden deel2
  | 'indication_submit'    // Opsturen Indicatie
  | 'insurer_inquiry';     // Vragen verzekeraar

export interface Task {
  id: string;
  clientId: string;
  clientName: string;
  type: TaskType;
  status: TaskStatus;
  title: string;
  description?: string;
  scheduledDate?: Date;
  deadline?: Date;
  completedDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;
  createdAt: Date;
  updatedAt: Date;
  address?: string;
  freeTextNotes?: string;
  documentLinks?: string[];
  reminderSent?: boolean;
  reminderDate?: Date;
  dependencies?: string[];
  nextTask?: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  tasks: Partial<Task>[];
  defaultDeadlines: Record<string, number>; // days offset
  dependencies: string[];
}

export interface Client {
  id: string;
  naam: string;
  address?: string;
}
