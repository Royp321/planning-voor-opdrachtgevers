import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar } from 'lucide-react';
import { truncateText } from '@/lib/utils';

export interface Project {
  id: string;
  title: string;
  description: string;
  progress: number;
  deadline: string;
  imageUrl: string;
}

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="overflow-hidden h-full">
      {project.imageUrl && (
        <div className="h-40 w-full overflow-hidden">
          <img 
            src={project.imageUrl} 
            alt={project.title} 
            className="h-full w-full object-cover" 
          />
        </div>
      )}
      
      <CardContent className="p-5">
        <h3 className="font-semibold text-lg mb-2">{project.title}</h3>
        <p className="text-gray-600 text-sm mb-4">
          {truncateText(project.description, 100)}
        </p>
        
        <div className="flex items-center justify-between text-sm mb-2">
          <span>Voortgang</span>
          <span className="font-medium">{project.progress}%</span>
        </div>
        
        <Progress value={project.progress} className="mb-4" />
        
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-2" />
          <span>Deadline: {project.deadline}</span>
        </div>
      </CardContent>
    </Card>
  );
}