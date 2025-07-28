import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/integrations/supabase/client";
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import AppLayout from '@/components/layout/AppLayout';

// Progress stages for general workflow
const PROGRESS_STAGES = [
  { 
    key: "planning", 
    label: "Planning", 
    color: "border-blue-400",
    bgColor: "bg-blue-50"
  },
  { 
    key: "in_progress", 
    label: "In Uitvoering", 
    color: "border-yellow-400",
    bgColor: "bg-yellow-50"
  },
  { 
    key: "review", 
    label: "Review", 
    color: "border-purple-400",
    bgColor: "bg-purple-50"
  },
  { 
    key: "completed", 
    label: "Voltooid", 
    color: "border-green-400",
    bgColor: "bg-green-50"
  },
  { 
    key: "on_hold", 
    label: "On Hold", 
    color: "border-orange-400",
    bgColor: "bg-orange-50"
  }
];

// Mock data for progress items
const fetchProgressItems = async () => {
  // This could be connected to actual database tables
  return [
    {
      id: '1',
      title: 'Client Intake Process',
      description: 'Complete intake documentation for new clients',
      stage: 'planning',
      priority: 'high',
      assignee: 'Team Lead',
      deadline: '2025-01-30',
      progress: 25
    },
    {
      id: '2',
      title: 'Document Review',
      description: 'Review and approve submitted documents',
      stage: 'in_progress',
      priority: 'medium',
      assignee: 'Document Specialist',
      deadline: '2025-01-28',
      progress: 60
    },
    {
      id: '3',
      title: 'Quality Assurance',
      description: 'Final quality check before completion',
      stage: 'review',
      priority: 'low',
      assignee: 'QA Team',
      deadline: '2025-02-05',
      progress: 90
    }
  ];
};

// Progress Item Card Component
const ProgressItemCard = ({ item, index }) => {
  const isOverdue = item.deadline && new Date(item.deadline) < new Date();
  const isHighPriority = item.priority === "high";

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            bg-white rounded-lg shadow-sm p-4 border-l-4 
            ${isHighPriority ? "border-red-500" : "border-blue-200"} 
            flex flex-col gap-3 hover:shadow-md transition-all duration-200
            ${snapshot.isDragging ? "ring-2 ring-blue-400 shadow-lg rotate-2" : ""}
            cursor-grab active:cursor-grabbing
          `}
        >
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">
              {item.title}
            </h4>
            <span className={`text-xs px-2 py-1 rounded font-medium ${getPriorityColor(item.priority)}`}>
              {item.priority}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 line-clamp-2">
            {item.description}
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${item.progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500">{item.progress}% voltooid</div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Toegewezen aan:</span>
              <span className="font-medium text-gray-700">{item.assignee}</span>
            </div>
            
            {item.deadline && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Deadline:</span>
                <span className={`font-medium ${
                  isOverdue 
                    ? "text-red-700" 
                    : "text-gray-700"
                }`}>
                  {new Date(item.deadline).toLocaleDateString("nl-NL")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

// Column Component
const ProgressColumn = ({ stage, items, onAddItem }) => {
  return (
    <Droppable droppableId={stage.key}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`
            flex-1 min-w-0 max-w-full ${stage.bgColor} rounded-lg border-t-4 ${stage.color} 
            shadow-sm p-4 flex flex-col transition-all duration-200
            ${snapshot.isDraggingOver ? "bg-blue-100 shadow-md scale-[1.02]" : ""}
          `}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-gray-800">{stage.label}</h3>
            <span className="bg-white text-gray-700 text-sm px-3 py-1 rounded-full font-medium shadow-sm">
              {items.length}
            </span>
          </div>
          
          <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto">
            {items.length === 0 ? (
              <div className="text-gray-400 text-sm text-center mt-8 italic">
                Geen items in deze fase
              </div>
            ) : (
              items.map((item, idx) => (
                <ProgressItemCard
                  key={item.id}
                  item={item}
                  index={idx}
                />
              ))
            )}
            {provided.placeholder}
          </div>
          
          <button 
            className="mt-4 bg-white hover:bg-gray-50 text-gray-700 text-sm px-3 py-2 rounded-md transition-colors border border-gray-200 shadow-sm"
            onClick={() => onAddItem?.(stage.key)}
          >
            + Nieuw item toevoegen
          </button>
        </div>
      )}
    </Droppable>
  );
};

// Main Progress Flow Page Component
const ProgressFlowPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Mock query for progress items
  const { 
    data: progressItems = [], 
    isLoading, 
    error 
  } = useQuery({ 
    queryKey: ["progressItems"], 
    queryFn: fetchProgressItems,
    staleTime: 30000,
  });

  // Group items by stage
  const itemsByStage = useMemo(() => {
    const grouped = {};
    PROGRESS_STAGES.forEach(stage => {
      grouped[stage.key] = [];
    });
    
    progressItems.forEach((item) => {
      if (grouped[item.stage]) {
        grouped[item.stage].push(item);
      } else {
        grouped['planning'].push(item);
      }
    });
    
    return grouped;
  }, [progressItems]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalItems = progressItems.length;
    const completedItems = progressItems.filter(item => item.stage === 'completed').length;
    const inProgressItems = progressItems.filter(item => item.stage === 'in_progress').length;
    const onHoldItems = progressItems.filter(item => item.stage === 'on_hold').length;
    
    return { totalItems, completedItems, inProgressItems, onHoldItems };
  }, [progressItems]);

  // Drag and drop handler
  const onDragEnd = useCallback((result) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const newStage = destination.droppableId;
    
    // Here you would update the item's stage in your database
    console.log(`Moving item ${draggableId} to stage ${newStage}`);
    toast.success(`Item verplaatst naar ${PROGRESS_STAGES.find(s => s.key === newStage)?.label}`);
  }, []);

  const handleAddItem = useCallback((stage) => {
    toast.info(`Functionaliteit voor toevoegen van nieuwe items in ${stage} komt binnenkort`);
  }, []);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-full mx-auto py-8 px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Progress items laden...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="max-w-full mx-auto py-8 px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Er is een fout opgetreden</h2>
            <p className="text-red-600">Kan progress items niet laden</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Progress Flow
              </h1>
              <p className="text-gray-600">
                Volg de voortgang van projecten en processen via een visueel kanban bord
              </p>
            </div>
            
            {/* Statistics Cards */}
            <div className="flex gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4 text-center border">
                <div className="text-2xl font-bold text-gray-900">{stats.totalItems}</div>
                <div className="text-sm text-gray-600">Totaal items</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 text-center border">
                <div className="text-2xl font-bold text-yellow-600">{stats.inProgressItems}</div>
                <div className="text-sm text-gray-600">In uitvoering</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 text-center border">
                <div className="text-2xl font-bold text-green-600">{stats.completedItems}</div>
                <div className="text-sm text-gray-600">Voltooid</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 text-center border">
                <div className="text-2xl font-bold text-orange-600">{stats.onHoldItems}</div>
                <div className="text-sm text-gray-600">On Hold</div>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <Link to="/taken">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Terug naar Taken
              </button>
            </Link>
            <Link to="/pgb-proces-flow">
              <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                PGB Proces Flow
              </button>
            </Link>
          </div>
        </div>

        {/* Progress Flow Board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex w-full gap-4 pb-6">
            {PROGRESS_STAGES.map((stage) => (
              <ProgressColumn
                key={stage.key}
                stage={stage}
                items={itemsByStage[stage.key]}
                onAddItem={handleAddItem}
              />
            ))}
          </div>
        </DragDropContext>

        {/* Summary */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6 border">
          <h3 className="font-semibold text-gray-800 mb-4">Overzicht Progress Flow</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {PROGRESS_STAGES.map((stage) => (
              <div key={stage.key} className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {itemsByStage[stage.key]?.length || 0}
                </div>
                <div className="text-sm text-gray-600">{stage.label}</div>
              </div>
            ))}
          </div>
          
          {progressItems.length === 0 && (
            <div className="text-center mt-6 py-8">
              <div className="text-gray-400 text-lg mb-2">📊</div>
              <p className="text-gray-500">Geen progress items gevonden</p>
              <button 
                onClick={() => handleAddItem('planning')}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Eerste item toevoegen
              </button>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 Tips voor Progress Flow:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Sleep items tussen kolommen om de voortgang bij te werken</li>
            <li>• Gebruik prioriteiten om belangrijke items te markeren</li>
            <li>• Houd deadlines in de gaten voor tijdige afronding</li>
            <li>• De voortgangsbalk toont hoeveel van een item al af is</li>
            <li>• Items worden automatisch gesorteerd op prioriteit en deadline</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProgressFlowPage;