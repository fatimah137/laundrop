const getDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const MOCK_ORDERS = [
  { id: 1,  order_number: 'LD-260429-1061', customer_name: 'Budi Hartono',   customer_phone: '081234567890', service_name: 'Cuci + Setrika', quantity: 3, unit: 'kg',  pickup_date: getDate(0), total_amount: 30000,  status: 'pending',   payment_status: 'unpaid', address: 'Jl. Mawar No. 1, Semarang',    assigned_employee: 'Andi Setiawan'  },
  { id: 2,  order_number: 'LD-260429-1209', customer_name: 'Maya Anggraini', customer_phone: '081234567891', service_name: 'Kilat',          quantity: 2, unit: 'kg',  pickup_date: getDate(0), total_amount: 30000,  status: 'pickup',    payment_status: 'unpaid', address: 'Jl. Melati No. 2, Semarang',   assigned_employee: 'Bela Rahmawati' },
  { id: 3,  order_number: 'LD-260429-5889', customer_name: 'Dimas Prasetyo', customer_phone: '081234567892', service_name: 'Setrika Saja',   quantity: 5, unit: 'kg',  pickup_date: getDate(1), total_amount: 25000,  status: 'proses',    payment_status: 'unpaid', address: 'Jl. Kenanga No. 3, Semarang',  assigned_employee: 'Ciko Pratama'   },
  { id: 4,  order_number: 'LD-260428-2618', customer_name: 'Ayu Lestari',    customer_phone: '081234567893', service_name: 'Cuci Kering',    quantity: 3, unit: 'pcs', pickup_date: getDate(1), total_amount: 120000, status: 'siap',      payment_status: 'paid',   address: 'Jl. Dahlia No. 4, Semarang',   assigned_employee: 'Andi Setiawan'  },
  { id: 5,  order_number: 'LD-260428-6393', customer_name: 'Rizky Maulana',  customer_phone: '081234567894', service_name: 'Cuci + Setrika', quantity: 4, unit: 'kg',  pickup_date: getDate(2), total_amount: 40000,  status: 'delivery',  payment_status: 'paid',   address: 'Jl. Anggrek No. 5, Semarang',  assigned_employee: 'Bela Rahmawati' },
  { id: 6,  order_number: 'LD-260427-3369', customer_name: 'Sarah Putri',    customer_phone: '081234567895', service_name: 'Kilat',          quantity: 2, unit: 'kg',  pickup_date: getDate(2), total_amount: 30000,  status: 'selesai',   payment_status: 'paid',   address: 'Jl. Flamboyan No. 6, Semarang', assigned_employee: 'Ciko Pratama'   },
  { id: 7,  order_number: 'LD-260427-7821', customer_name: 'Fajar Nugroho',  customer_phone: '081234567896', service_name: 'Cuci + Setrika', quantity: 3, unit: 'kg',  pickup_date: getDate(3), total_amount: 30000,  status: 'selesai',   payment_status: 'paid',   address: 'Jl. Pahlawan No. 7, Semarang',  assigned_employee: 'Andi Setiawan'  },
  { id: 8,  order_number: 'LD-260426-4452', customer_name: 'Lina Marlina',   customer_phone: '081234567897', service_name: 'Cuci Kering',    quantity: 2, unit: 'pcs', pickup_date: getDate(3), total_amount: 80000,  status: 'cancelled', payment_status: 'unpaid', address: 'Jl. Merdeka No. 8, Semarang',   assigned_employee: 'Bela Rahmawati' },
  { id: 9,  order_number: 'LD-260426-3310', customer_name: 'Hendra Wijaya',  customer_phone: '081234567898', service_name: 'Setrika Saja',   quantity: 4, unit: 'kg',  pickup_date: getDate(4), total_amount: 20000,  status: 'selesai',   payment_status: 'paid',   address: 'Jl. Sudirman No. 9, Semarang',  assigned_employee: 'Ciko Pratama'   },
  { id: 10, order_number: 'LD-260425-2291', customer_name: 'Rina Kusuma',    customer_phone: '081234567899', service_name: 'Cuci + Setrika', quantity: 3, unit: 'kg',  pickup_date: getDate(4), total_amount: 30000,  status: 'selesai',   payment_status: 'paid',   address: 'Jl. Diponegoro No. 10, Semarang', assigned_employee: 'Andi Setiawan'},
  { id: 11, order_number: 'LD-260425-9981', customer_name: 'Citra Dewi',     customer_phone: '081234567800', service_name: 'Cuci Kering',    quantity: 3, unit: 'pcs', pickup_date: getDate(5), total_amount: 120000, status: 'selesai',   payment_status: 'paid',   address: 'Jl. Ahmad Yani No. 11, Semarang', assigned_employee: 'Bela Rahmawati'},
  { id: 12, order_number: 'LD-260424-5544', customer_name: 'Doni Prasetyo',  customer_phone: '081234567801', service_name: 'Cuci + Setrika', quantity: 4, unit: 'kg',  pickup_date: getDate(5), total_amount: 40000,  status: 'selesai',   payment_status: 'paid',   address: 'Jl. Gatot Subroto No. 12, Semarang', assigned_employee: 'Ciko Pratama'},
  { id: 13, order_number: 'LD-260424-7723', customer_name: 'Eka Putri',      customer_phone: '081234567802', service_name: 'Setrika Saja',   quantity: 5, unit: 'kg',  pickup_date: getDate(6), total_amount: 25000,  status: 'selesai',   payment_status: 'paid',   address: 'Jl. Pemuda No. 13, Semarang',   assigned_employee: 'Andi Setiawan'  },
  { id: 14, order_number: 'LD-260423-3312', customer_name: 'Fandi Ahmad',    customer_phone: '081234567803', service_name: 'Kilat',          quantity: 2, unit: 'kg',  pickup_date: getDate(6), total_amount: 30000,  status: 'selesai',   payment_status: 'paid',   address: 'Jl. Imam Bonjol No. 14, Semarang', assigned_employee: 'Bela Rahmawati'},
  { id: 15, order_number: 'LD-260422-1108', customer_name: 'Gita Nuraini',   customer_phone: '081234567804', service_name: 'Cuci + Setrika', quantity: 6, unit: 'kg',  pickup_date: getDate(7), total_amount: 60000,  status: 'selesai',   payment_status: 'paid',   address: 'Jl. Kartini No. 15, Semarang',  assigned_employee: 'Ciko Pratama'   },
];

export const MOCK_CUSTOMERS = [
  { id: 1, name: 'Budi Hartono',   email: 'budi@email.com',   phone: '081234567890', address: 'Jl. Mawar No. 1, Semarang'     },
  { id: 2, name: 'Maya Anggraini', email: 'maya@email.com',   phone: '081234567891', address: 'Jl. Melati No. 2, Semarang'    },
  { id: 3, name: 'Dimas Prasetyo', email: 'dimas@email.com',  phone: '081234567892', address: 'Jl. Kenanga No. 3, Semarang'   },
  { id: 4, name: 'Ayu Lestari',    email: 'ayu@email.com',    phone: '081234567893', address: 'Jl. Dahlia No. 4, Semarang'    },
  { id: 5, name: 'Rizky Maulana',  email: 'rizky@email.com',  phone: '081234567894', address: 'Jl. Anggrek No. 5, Semarang'   },
  { id: 6, name: 'Sarah Putri',    email: 'sarah@email.com',  phone: '081234567895', address: 'Jl. Flamboyan No. 6, Semarang' },
];

export const MOCK_EMPLOYEES = [
  { id: 1, name: 'Andi Setiawan',  email: 'andi@laundrop.com', phone: '081111111111', role: 'karyawan', joined: '2023-01-10' },
  { id: 2, name: 'Bela Rahmawati', email: 'bela@laundrop.com', phone: '081111111112', role: 'karyawan', joined: '2023-03-15' },
  { id: 3, name: 'Ciko Pratama',   email: 'ciko@laundrop.com', phone: '081111111113', role: 'karyawan', joined: '2023-06-01' },
];

export const MOCK_SERVICES = [
  { id: 1, name: 'Cuci + Setrika', price: 10000, unit: 'kg',  duration: '2-3 hari', description: 'Mencuci dan menyetrika pakaian'         },
  { id: 2, name: 'Setrika Saja',   price: 5000,  unit: 'kg',  duration: '1-2 hari', description: 'Hanya menyetrika pakaian'                },
  { id: 3, name: 'Cuci Kering',    price: 40000, unit: 'pcs', duration: '3-5 hari', description: 'Dry cleaning untuk pakaian formal'        },
  { id: 4, name: 'Kilat',          price: 15000, unit: 'kg',  duration: '24 jam',   description: 'Selesai dalam 24 jam, cocok untuk darurat' },
];