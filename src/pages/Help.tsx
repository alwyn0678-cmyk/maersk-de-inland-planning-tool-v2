import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, HelpCircle, MessageCircle, FileText, ExternalLink, Mail, Phone } from 'lucide-react';
import { motion } from 'motion/react';

export function Help() {
  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black tracking-tight text-slate-900">How can we help?</h2>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">Search our knowledge base or contact our support team for assistance.</p>
        <div className="max-w-xl mx-auto relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#42b0d5] transition-colors" />
          <Input 
            placeholder="Search for help articles, guides, and FAQs..." 
            className="pl-12 h-14 rounded-2xl bg-white border-slate-200 shadow-xl shadow-slate-200/50 focus-visible:ring-1 focus-visible:ring-[#42b0d5] text-lg"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {[
          { icon: FileText, title: 'User Guides', desc: 'Step-by-step instructions for all features.', color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: HelpCircle, title: 'FAQs', desc: 'Quick answers to common questions.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { icon: MessageCircle, title: 'Live Chat', desc: 'Chat with our support team in real-time.', color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-sm bg-white/50 backdrop-blur-sm p-8 hover:scale-[1.02] transition-transform cursor-pointer group">
            <div className={`h-14 w-14 ${item.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <item.icon className={`h-7 w-7 ${item.color}`} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">{item.desc}</p>
            <Button variant="ghost" className="p-0 h-auto text-blue-600 hover:bg-transparent hover:text-blue-700 font-bold text-sm">
              Learn More <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-slate-50">
            <CardTitle className="text-2xl font-bold text-slate-900">Contact Support</CardTitle>
            <CardDescription>Our team is available 24/7 for critical operational issues.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Email Support</p>
                <p className="text-sm text-slate-500">support@maersk-inland.com</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Phone className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Phone Support</p>
                <p className="text-sm text-slate-500">+49 40 1234 5678</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-[#00243d] text-white">
          <CardHeader className="p-8 border-b border-white/10">
            <CardTitle className="text-2xl font-bold">System Status</CardTitle>
            <CardDescription className="text-blue-200">Current operational status of all services.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {[
                { label: 'API Gateway', status: 'Operational', color: 'bg-emerald-400' },
                { label: 'Optimization Engine', status: 'Operational', color: 'bg-emerald-400' },
                { label: 'Map Services', status: 'Operational', color: 'bg-emerald-400' },
                { label: 'Authentication', status: 'Operational', color: 'bg-emerald-400' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm font-bold">{item.label}</span>
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${item.color} animate-pulse`} />
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-200">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
