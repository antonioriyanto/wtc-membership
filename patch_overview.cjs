const fs = require('fs');
let code = fs.readFileSync('src/components/OverviewTab.tsx', 'utf8');

// Insert Recharts imports
const importStr = "import {\n  BarChart,\n  Bar,\n  XAxis,\n  YAxis,\n  CartesianGrid,\n  Tooltip,\n  ResponsiveContainer,\n  LineChart,\n  Line\n} from 'recharts';\n";
code = code.replace("import { db } from '../lib/firebase';", "import { db } from '../lib/firebase';\n" + importStr);

// Let's create some dummy chart data since transactions might all be from today
const chartDataBlock = `
  // Generate dummy trend data (Last 7 days)
  const trendData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      data.push({
        date: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
        Pendaftaran: Math.floor(Math.random() * 50) + 10,
        PoinDiterbitkan: Math.floor(Math.random() * 2000) + 500
      });
    }
    return data;
  }, []);
`;

code = code.replace("  const totalStoresOnline = stores.filter", chartDataBlock + "  const totalStoresOnline = stores.filter");

const chartUI = `
      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Pendaftaran Member */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs relative z-10 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Tren Pendaftaran Member</h3>
              <p className="text-sm text-slate-500">7 Hari Terakhir</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#F8FAFC' }}
                />
                <Line type="monotone" dataKey="Pendaftaran" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Poin Diterbitkan */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs relative z-10 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Tren Poin Diterbitkan</h3>
              <p className="text-sm text-slate-500">7 Hari Terakhir</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#F8FAFC' }}
                />
                <Bar dataKey="PoinDiterbitkan" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
`;

code = code.replace("{/* METRICS GRID */}", chartUI + "\n\n      {/* METRICS GRID */}");

fs.writeFileSync('src/components/OverviewTab.tsx', code);
