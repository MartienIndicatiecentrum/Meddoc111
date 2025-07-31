import React from 'react';
import { Link } from 'react-router-dom';

export interface Appointment {
  id: number;
  date: string;
  client: string;
}

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
  max?: number;
}

const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({
  appointments,
  max = 3,
}) => {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('nl-NL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const getPriorityColor = (dateString: string) => {
    const appointmentDate = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil(
      (appointmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return 'text-red-600 font-semibold';
    } // Today
    if (diffDays <= 3) {
      return 'text-orange-600 font-medium';
    } // Within 3 days
    return 'text-gray-400'; // Normal
  };

  return (
    <div className='bg-white rounded shadow p-4 mb-4'>
      <div className='heading-sm mb-2'>Komende afspraken</div>
      {appointments.length === 0 ? (
        <p className='text-sm text-gray-500 italic'>Geen komende afspraken</p>
      ) : (
        <ul className='text-sm text-gray-700 list-disc ml-6'>
          {appointments.slice(0, max).map(appt => {
            const { date, time } = formatDateTime(appt.date);
            return (
              <li key={appt.id} className='mb-1'>
                <span className='font-medium'>{appt.client}</span>
                <br />
                <span className={`text-xs ${getPriorityColor(appt.date)}`}>
                  {date} {time}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {appointments.length > max && (
        <div className='mt-2'>
          <Link
            to='/planning'
            className='text-xs text-blue-600 hover:text-blue-800 hover:underline'
          >
            Bekijk alle {appointments.length} afspraken →
          </Link>
        </div>
      )}
    </div>
  );
};

export default UpcomingAppointments;
