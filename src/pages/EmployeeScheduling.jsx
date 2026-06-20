import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Calendar as CalendarIcon, Clock, User } from "lucide-react";
import { toast } from "sonner";

export default function EmployeeScheduling() {
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const queryClient = useQueryClient();

  const { data: schedules = [] } = useQuery({
    queryKey: ['employee-schedules'],
    queryFn: () => base44.entities.EmployeeSchedule.list('-shift_date'),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.User.filter({}),
  });

  const createScheduleMutation = useMutation({
    mutationFn: (data) => base44.entities.EmployeeSchedule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-schedules'] });
      setShowForm(false);
      toast.success('Schedule created');
    },
  });

  const schedulesOnDate = schedules.filter(s => 
    s.shift_date === selectedDate.toISOString().split('T')[0]
  );

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Employee Scheduling</h1>
            <p className="text-muted-foreground">Manage staff shifts and schedules</p>
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Shift
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Employee Shift</DialogTitle>
              </DialogHeader>
              <ScheduleForm
                employees={employees.filter(e => e.role !== 'admin')}
                onSubmit={(data) => createScheduleMutation.mutate(data)}
                onCancel={() => setShowForm(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Shifts for {selectedDate.toLocaleDateString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schedulesOnDate.map(schedule => (
                  <div key={schedule.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{schedule.employee_name}</p>
                        <p className="text-sm text-muted-foreground">{schedule.shift_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-4 h-4" />
                        {schedule.start_time} - {schedule.end_time}
                      </div>
                      <Badge>{schedule.status}</Badge>
                    </div>
                  </div>
                ))}
                {schedulesOnDate.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No shifts scheduled</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {schedules.slice(0, 10).map(schedule => (
                <div key={schedule.id} className="flex items-center justify-between p-2 border-b">
                  <div>
                    <p className="font-medium">{schedule.employee_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(schedule.shift_date).toLocaleDateString()} • {schedule.start_time}-{schedule.end_time}
                    </p>
                  </div>
                  <Badge variant={schedule.status === 'confirmed' ? 'default' : 'secondary'}>
                    {schedule.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ScheduleForm({ employees, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    employee_id: '',
    employee_name: '',
    shift_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '17:00',
    shift_type: 'morning',
    status: 'scheduled',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Employee</Label>
        <Select
          value={formData.employee_id}
          onValueChange={(value) => {
            const emp = employees.find(e => e.id === value);
            setFormData(prev => ({ ...prev, employee_id: value, employee_name: emp?.full_name || '' }));
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select employee" />
          </SelectTrigger>
          <SelectContent>
            {employees.map(emp => (
              <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Shift Date</Label>
        <Input type="date" value={formData.shift_date} onChange={e => setFormData(prev => ({ ...prev, shift_date: e.target.value }))} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Time</Label>
          <Input type="time" value={formData.start_time} onChange={e => setFormData(prev => ({ ...prev, start_time: e.target.value }))} required />
        </div>
        <div>
          <Label>End Time</Label>
          <Input type="time" value={formData.end_time} onChange={e => setFormData(prev => ({ ...prev, end_time: e.target.value }))} required />
        </div>
      </div>
      <div>
        <Label>Shift Type</Label>
        <Select value={formData.shift_type} onValueChange={v => setFormData(prev => ({ ...prev, shift_type: v }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="morning">Morning</SelectItem>
            <SelectItem value="afternoon">Afternoon</SelectItem>
            <SelectItem value="evening">Evening</SelectItem>
            <SelectItem value="night">Night</SelectItem>
            <SelectItem value="full_day">Full Day</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Notes</Label>
        <Input value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Optional notes" />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Schedule Shift</Button>
      </div>
    </form>
  );
}