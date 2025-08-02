import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';

interface AnalystQuote {
  id: string;
  quote: string;
  analyst: string;
  company: string;
  date: string;
  source?: string;
}

interface AnalystQuoteDisplayProps {
  quotes: AnalystQuote[];
}

export function AnalystQuoteDisplay({ quotes }: AnalystQuoteDisplayProps) {
  if (!quotes || quotes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Quote className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium mb-2">No quotes available</p>
        <p className="text-sm">Analyst quotes will appear here when available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {quotes.map((quote) => (
        <Card key={quote.id} className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Quote className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <blockquote className="text-gray-800 mb-4 text-lg leading-relaxed">
                  "{quote.quote}"
                </blockquote>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{quote.analyst}</p>
                  <p>{quote.company}</p>
                  <p className="text-gray-500">{new Date(quote.date).toLocaleDateString()}</p>
                  {quote.source && (
                    <p className="text-blue-600 hover:text-blue-800">
                      <a href={quote.source} target="_blank" rel="noopener noreferrer">
                        View Source
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
