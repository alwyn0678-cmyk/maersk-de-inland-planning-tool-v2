import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { User, Bell, Shield, Globe, Zap, Save } from 'lucide-react';
import { motion } from 'motion/react';

export function Settings() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h2>
        <p className="text-slate-500 mt-1">Manage your account preferences and system configuration.</p>
      </div>

      <div className="grid gap-8">
        {/* Profile Settings */}
        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-100/50 bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg font-bold">Profile Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue="Alwyn" className="bg-white border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" defaultValue="alwyn@maersk.com" className="bg-white border-slate-200" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" defaultValue="Senior Inland Planner" disabled className="bg-slate-50 border-slate-200" />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-100/50 bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-lg font-bold">Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-slate-500">Receive daily summary reports and critical alerts.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">System Alerts</Label>
                <p className="text-sm text-slate-500">Real-time browser notifications for network delays.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* System Preferences */}
        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-100/50 bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-lg font-bold">System Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Auto-Optimize Routes</Label>
                <p className="text-sm text-slate-500">Automatically select the most cost-effective route.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">High Contrast Map</Label>
                <p className="text-sm text-slate-500">Use high-visibility tiles for the route visualization.</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" className="bg-white border-slate-200">Cancel</Button>
          <Button className="bg-[#00243d] text-white hover:bg-[#00243d]/90 shadow-lg shadow-[#00243d]/10">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
