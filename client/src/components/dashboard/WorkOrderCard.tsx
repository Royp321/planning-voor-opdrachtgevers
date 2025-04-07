import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin } from 'lucide-react';
import { getStatusColor } from '@/lib/utils';

export interface WorkOrder {
  id: string;
  title: string;
  status: string;
  customer: string;
  location: string;
  date: string;
}

export default function WorkOrderCard({ order }: { order: WorkOrder }) {
  const statusColor = getStatusColor(order.status);
  
  return (
    <Card className="h-full">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg truncate">{order.title}</h3>
          <Badge className={statusColor}>{order.status}</Badge>
        </div>
        
        <div className="text-gray-600 mb-1">{order.customer}</div>
        
        <div className="flex flex-col space-y-2 mt-4 text-sm text-gray-500">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{order.location}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{order.date}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}