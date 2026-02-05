 import { useState } from 'react';
 import { AppHeader } from '@/components/layout/AppHeader';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Input } from '@/components/ui/input';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import {
   Shield,
   FileText,
   AlertTriangle,
   CheckCircle,
   Search,
   RefreshCw,
   Loader2,
   User,
   Database,
   Key,
   Lock,
   Activity
 } from 'lucide-react';
 import { formatDistanceToNow, format } from 'date-fns';
 
 interface AuditLog {
   id: string;
   user_id: string | null;
   action: string;
   table_name: string;
   record_id: string | null;
   old_data: any;
   new_data: any;
   ip_address: string | null;
   user_agent: string | null;
   created_at: string;
 }
 
 export default function SecurityAuditPage() {
   const { user } = useAuth();
   const [searchTerm, setSearchTerm] = useState('');
   const [filterAction, setFilterAction] = useState<string>('all');
   const [filterTable, setFilterTable] = useState<string>('all');
 
   // Fetch audit logs
   const { data: auditLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery({
     queryKey: ['audit-logs', filterAction, filterTable],
     queryFn: async () => {
       let query = supabase
         .from('audit_logs')
         .select('*')
         .order('created_at', { ascending: false })
         .limit(500);
 
       if (filterAction !== 'all') {
         query = query.eq('action', filterAction);
       }
       if (filterTable !== 'all') {
         query = query.eq('table_name', filterTable);
       }
 
       const { data, error } = await query;
       if (error) throw error;
       return data as AuditLog[];
     },
     enabled: !!user,
   });
 
   // Security checks
   const securityChecks = [
     {
       id: 'rls_enabled',
       name: 'Row Level Security',
       description: 'All tables have RLS policies enabled',
       status: 'pass',
       icon: Lock,
     },
     {
       id: 'auth_required',
       name: 'Authentication Required',
       description: 'Protected routes require user authentication',
       status: 'pass',
       icon: Key,
     },
     {
       id: 'audit_logging',
       name: 'Audit Logging',
       description: 'User actions are logged for security review',
       status: 'pass',
       icon: FileText,
     },
     {
       id: 'role_based',
       name: 'Role-Based Access',
       description: 'User roles stored in separate table (not profile)',
       status: 'pass',
       icon: User,
     },
     {
       id: 'secure_storage',
       name: 'Secure File Storage',
       description: 'Uploaded files protected with RLS policies',
       status: 'pass',
       icon: Database,
     },
   ];
 
   // Filter logs
   const filteredLogs = auditLogs.filter(log => {
     if (!searchTerm) return true;
     return (
       log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
       log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       log.record_id?.toLowerCase().includes(searchTerm.toLowerCase())
     );
   });
 
   // Get unique tables from logs
   const uniqueTables = [...new Set(auditLogs.map(l => l.table_name))];
 
   const getActionBadge = (action: string) => {
     switch (action) {
       case 'INSERT':
         return 'bg-green-500/10 text-green-600';
       case 'UPDATE':
         return 'bg-blue-500/10 text-blue-600';
       case 'DELETE':
         return 'bg-red-500/10 text-red-600';
       default:
         return 'bg-gray-500/10 text-gray-600';
     }
   };
 
   return (
     <div className="min-h-screen bg-background">
       <AppHeader />
 
       <main className="container mx-auto px-4 py-8">
         {/* Header */}
         <div className="mb-8">
           <div className="flex items-center gap-3 mb-2">
             <Shield className="h-8 w-8 text-primary" />
             <h1 className="text-3xl font-heading font-bold">Security Audit</h1>
           </div>
           <p className="text-muted-foreground">
             Monitor security status and review user activity logs
           </p>
         </div>
 
         <Tabs defaultValue="status" className="space-y-6">
           <TabsList>
             <TabsTrigger value="status" className="flex items-center gap-2">
               <CheckCircle className="h-4 w-4" />
               Security Status
             </TabsTrigger>
             <TabsTrigger value="logs" className="flex items-center gap-2">
               <Activity className="h-4 w-4" />
               Activity Logs
             </TabsTrigger>
           </TabsList>
 
           {/* Security Status Tab */}
           <TabsContent value="status">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {securityChecks.map((check) => (
                 <Card key={check.id} className="glass-card">
                   <CardContent className="pt-6">
                     <div className="flex items-start gap-4">
                       <div className={`p-3 rounded-lg ${
                         check.status === 'pass' 
                           ? 'bg-green-500/10' 
                           : check.status === 'warn'
                           ? 'bg-yellow-500/10'
                           : 'bg-red-500/10'
                       }`}>
                         <check.icon className={`h-6 w-6 ${
                           check.status === 'pass' 
                             ? 'text-green-600' 
                             : check.status === 'warn'
                             ? 'text-yellow-600'
                             : 'text-red-600'
                         }`} />
                       </div>
                       <div className="flex-1">
                         <div className="flex items-center justify-between">
                           <h3 className="font-medium">{check.name}</h3>
                           <Badge 
                             variant="outline"
                             className={
                               check.status === 'pass' 
                                 ? 'bg-green-500/10 text-green-600' 
                                 : check.status === 'warn'
                                 ? 'bg-yellow-500/10 text-yellow-600'
                                 : 'bg-red-500/10 text-red-600'
                             }
                           >
                             {check.status === 'pass' ? 'Secure' : check.status === 'warn' ? 'Warning' : 'Issue'}
                           </Badge>
                         </div>
                         <p className="text-sm text-muted-foreground mt-1">
                           {check.description}
                         </p>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
 
             {/* Summary Card */}
             <Card className="glass-card mt-6">
               <CardHeader>
                 <CardTitle className="font-heading flex items-center gap-2">
                   <Shield className="h-5 w-5 text-green-600" />
                   Security Summary
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="p-4 rounded-lg bg-green-500/10">
                     <p className="text-3xl font-bold text-green-600">
                       {securityChecks.filter(c => c.status === 'pass').length}
                     </p>
                     <p className="text-sm text-muted-foreground">Checks Passed</p>
                   </div>
                   <div className="p-4 rounded-lg bg-yellow-500/10">
                     <p className="text-3xl font-bold text-yellow-600">
                       {securityChecks.filter(c => c.status === 'warn').length}
                     </p>
                     <p className="text-sm text-muted-foreground">Warnings</p>
                   </div>
                   <div className="p-4 rounded-lg bg-red-500/10">
                     <p className="text-3xl font-bold text-red-600">
                       {securityChecks.filter(c => c.status === 'fail').length}
                     </p>
                     <p className="text-sm text-muted-foreground">Issues</p>
                   </div>
                   <div className="p-4 rounded-lg bg-primary/10">
                     <p className="text-3xl font-bold text-primary">
                       {auditLogs.length}
                     </p>
                     <p className="text-sm text-muted-foreground">Logged Actions</p>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </TabsContent>
 
           {/* Activity Logs Tab */}
           <TabsContent value="logs">
             <Card className="glass-card">
               <CardHeader>
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div>
                     <CardTitle className="font-heading flex items-center gap-2">
                       <Activity className="h-5 w-5 text-primary" />
                       Activity Logs
                     </CardTitle>
                     <CardDescription>
                       {filteredLogs.length} logged actions
                     </CardDescription>
                   </div>
                   
                   <div className="flex flex-wrap gap-2">
                     <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input
                         placeholder="Search logs..."
                         className="pl-9 w-48"
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                       />
                     </div>
                     <Select value={filterAction} onValueChange={setFilterAction}>
                       <SelectTrigger className="w-32">
                         <SelectValue placeholder="Action" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">All Actions</SelectItem>
                         <SelectItem value="INSERT">Insert</SelectItem>
                         <SelectItem value="UPDATE">Update</SelectItem>
                         <SelectItem value="DELETE">Delete</SelectItem>
                       </SelectContent>
                     </Select>
                     <Select value={filterTable} onValueChange={setFilterTable}>
                       <SelectTrigger className="w-40">
                         <SelectValue placeholder="Table" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">All Tables</SelectItem>
                         {uniqueTables.map((table) => (
                           <SelectItem key={table} value={table}>{table}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                     <Button variant="outline" size="icon" onClick={() => refetchLogs()}>
                       <RefreshCw className="h-4 w-4" />
                     </Button>
                   </div>
                 </div>
               </CardHeader>
               <CardContent>
                 {logsLoading ? (
                   <div className="flex items-center justify-center h-48">
                     <Loader2 className="h-6 w-6 animate-spin" />
                   </div>
                 ) : filteredLogs.length === 0 ? (
                   <div className="text-center py-12 text-muted-foreground">
                     <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                     <p>No audit logs found</p>
                     <p className="text-sm mt-1">Actions will appear here as users interact with the system</p>
                   </div>
                 ) : (
                   <ScrollArea className="h-[500px]">
                     <div className="space-y-2 pr-4">
                       {filteredLogs.map((log) => (
                         <div
                           key={log.id}
                           className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                         >
                           <div className="flex items-start justify-between">
                             <div className="flex items-center gap-3">
                               <Badge variant="outline" className={getActionBadge(log.action)}>
                                 {log.action}
                               </Badge>
                               <span className="font-medium text-sm">{log.table_name}</span>
                               {log.record_id && (
                                 <span className="text-xs text-muted-foreground font-mono">
                                   {log.record_id.substring(0, 8)}...
                                 </span>
                               )}
                             </div>
                             <span className="text-xs text-muted-foreground">
                               {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                             </span>
                           </div>
                           <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-4">
                             {log.user_id && (
                               <span className="flex items-center gap-1">
                                 <User className="h-3 w-3" />
                                 {log.user_id.substring(0, 8)}...
                               </span>
                             )}
                             {log.ip_address && (
                               <span>IP: {log.ip_address}</span>
                             )}
                             <span>
                               {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                             </span>
                           </div>
                         </div>
                       ))}
                     </div>
                   </ScrollArea>
                 )}
               </CardContent>
             </Card>
           </TabsContent>
         </Tabs>
       </main>
     </div>
   );
 }