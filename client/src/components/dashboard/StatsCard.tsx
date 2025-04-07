import React, { ReactNode } from 'react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface StatsCardProps {
  title: string;
  count: number;
  icon: ReactNode;
  linkText: string;
  linkUrl: string;
}

export default function StatsCard({
  title,
  count,
  icon,
  linkText,
  linkUrl,
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col p-6">
        <div className="flex items-center justify-between">
          <div className="rounded-full bg-primary bg-opacity-10 p-3 text-primary">
            {icon}
          </div>
          <p className="text-3xl font-bold">{count}</p>
        </div>
        <h3 className="mt-4 text-lg font-medium">{title}</h3>
        <Link href={linkUrl}>
          <div className="mt-3 flex items-center text-sm text-primary font-medium cursor-pointer">
            <span>{linkText}</span>
            <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}