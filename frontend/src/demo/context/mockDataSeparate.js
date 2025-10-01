export const mockPatients = [
  {
    id: 1,
    name: 'John Smith',
    avatar: 'JS',
    condition: 'Shoulder Impingement',
    progress: 'Improving',
    lastSession: '2 hours ago',
    adherence: '85%',
    status: 'Active',
    contact: '+1 (555) 123-4567',
    dob: '1985-03-15',
    gender: 'Male',
    medicalIssue: 'Chronic shoulder pain from repetitive motion',
    treatment: 'Physical therapy with strengthening exercises',
    assignedTeam: 'Dr. Sarah Johnson, PT Assistant Mike',
    progressData: [10, 20, 30, 40, 50, 60, 70]
  },
  {
    id: 2,
    name: 'Maria Garcia',
    avatar: 'MG',
    condition: 'Knee Rehabilitation',
    progress: 'Plateau',
    lastSession: '3 days ago',
    adherence: '62%',
    status: 'Needs Attention',
    contact: '+1 (555) 234-5678',
    dob: '1992-07-22',
    gender: 'Female',
    medicalIssue: 'ACL reconstruction recovery',
    treatment: 'Progressive strengthening and balance training',
    assignedTeam: 'Dr. Sarah Johnson, PT Assistant Lisa',
    progressData: [10, 25, 35, 40, 40, 50, 45]
  },
  {
    id: 3,
    name: 'Robert Chen',
    avatar: 'RC',
    condition: 'Lower Back Pain',
    progress: 'Starting',
    lastSession: 'Never',
    adherence: 'N/A',
    status: 'New Patient',
    contact: '+1 (555) 345-6789',
    dob: '1978-11-08',
    gender: 'Male',
    medicalIssue: 'Chronic lower back pain from poor posture',
    treatment: 'Core strengthening and posture correction',
    assignedTeam: 'Dr. Sarah Johnson, PT Assistant Tom',
    progressData: [5, 10, 15, 20, 25, 30, 35]
  }
];

export const mockDoctor = {
  name: 'Dr. Sarah Johnson',
  initials: 'SJ',
  specialty: 'Sports Rehabilitation',
  experience: '15 years',
  patients: 24,
  sessionsThisMonth: 156,
  contact: '+1 (555) 987-6543',
  email: 'sarah.johnson@physiotrack.com'
};

export const mockReports = [
  {
    id: 1,
    patientId: 1,
    patientName: 'John Smith',
    date: '2024-01-15',
    progressData: {
      pain: [8, 7, 6, 5, 4, 3],
      rom: [45, 52, 58, 65, 72, 78]
    },
    sessions: [
      { date: '2024-01-08', type: 'Shoulder Flexion', completed: true },
      { date: '2024-01-10', type: 'Balance Training', completed: true },
      { date: '2024-01-12', type: 'Knee Strengthening', completed: false }
    ],
    videoClips: [
      { id: 1, title: 'Week 1 Progress', thumbnail: '🎥', duration: '2:30' },
      { id: 2, title: 'Week 2 Improvement', thumbnail: '🎥', duration: '1:45' }
    ]
  }
];