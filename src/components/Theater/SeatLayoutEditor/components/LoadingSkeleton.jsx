import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function SidebarSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Tabs skeleton */}
      <div className="flex gap-2 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 flex-1 bg-muted animate-pulse rounded-md" />
        ))}
      </div>

      {/* Card skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-8 w-full bg-muted animate-pulse rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function CanvasSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-muted/10">
      <motion.div
        className="space-y-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-8 gap-2">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-8 h-8 bg-muted rounded"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: i * 0.02,
                type: 'spring',
                stiffness: 200,
                damping: 15
              }}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4">Loading layout...</p>
      </motion.div>
    </div>
  );
}

export function ToolbarSkeleton() {
  return (
    <div className="seat-toolbar">
      <div className="flex items-center gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="w-10 h-10 bg-muted animate-pulse rounded-md" />
        ))}
        <Separator orientation="vertical" className="h-8 mx-2" />
        <div className="w-10 h-10 bg-muted animate-pulse rounded-md" />
        <div className="w-10 h-10 bg-muted animate-pulse rounded-md" />
      </div>
    </div>
  );
}
