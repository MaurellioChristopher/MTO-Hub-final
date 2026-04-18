export interface StaffBirthday {
  name: string;
  day: number;
  month: number; // 1-12
  year?: number;
}

export const BIRTHDAY_DATA: StaffBirthday[] = [
  // Februari
  { name: "Affan Maulana Raffi", day: 3, month: 2, year: 2005 },
  { name: "Salsabila Febrianti", day: 10, month: 2, year: 2005 },
  { name: "Fiina Salsabila", day: 14, month: 2, year: 2005 },
  { name: "Siti Zakiyah Iqrima Cantika", day: 20, month: 2, year: 2007 },

  // Maret
  { name: "I Nyoman Aditya Wahyu Nugraha", day: 5, month: 3, year: 2006 },
  { name: "Intan Callysta", day: 6, month: 3, year: 2008 },
  { name: "Muhammad Farhan Adly", day: 17, month: 3, year: 2006 },
  { name: "Muhammad Daffa Fachrurozi", day: 21, month: 3, year: 2006 },

  // April
  { name: "Minati Nur Alifa", day: 18, month: 4, year: 2006 },
  { name: "Naifah Bratandari", day: 21, month: 4, year: 2006 },
  { name: "Siti Fadhilah Nur Nisrina", day: 26, month: 4, year: 2006 },
  { name: "Mutiara Nabila Putri Muslim", day: 29, month: 4, year: 2006 },

  // Mei
  { name: "Asep Ahmad Nugraha", day: 5, month: 5, year: 2007 },
  { name: "Mochamad Aldino", day: 15, month: 5, year: 2007 },
  { name: "Annisa Shabrina", day: 20, month: 5, year: 2007 },
  { name: "Sasi Azhari Kirana Putri", day: 29, month: 5, year: 2005 },

  // Juni
  { name: "Arsy Ananda Hidayatullah", day: 26, month: 6, year: 2007 },
  { name: "Nadya Shandi Waranggani", day: 29, month: 6, year: 2006 },

  // Agustus
  { name: "Aisya Husna Falihah", day: 2, month: 8, year: 2006 },
  { name: "Moch Fasya Fawana Adi Sagara", day: 13, month: 8, year: 2005 },
  { name: "Muhammad Noval Agustian", day: 14, month: 8, year: 2005 },
  { name: "Agum Jati Gumelar", day: 14, month: 8, year: 2005 },

  // Oktober
  { name: "Maulida Kyla Firamadani", day: 10, month: 10, year: 2006 },
  { name: "Ayesha Elora Nuro Vitria", day: 23, month: 10, year: 2006 },

  // Desember
  { name: "AHMAD NABILI AKMAL", day: 21, month: 12, year: 2007 },
];
