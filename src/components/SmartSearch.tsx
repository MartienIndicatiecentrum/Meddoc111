
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Brain, 
  Filter, 
  Calendar,
  FileText,
  Clock,
  TrendingUp,
  Sparkles,
  MessageCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Document {
  id: string;
  title: string;
  type: string;
  status: 'nieuw' | 'in_behandeling' | 'wacht_op_info' | 'afgehandeld' | 'geannuleerd';
  priority: 'laag' | 'normaal' | 'hoog' | 'urgent';
  deadline?: Date;
  created_at: Date;
  file_size: number;
  mime_type: string;
}

interface SmartSearchProps {
  documents: Document[];
}

interface SearchResult {
  document: Document;
  relevance: number;
  summary: string;
  keyPhrases: string[];
}

export const SmartSearch: React.FC<SmartSearchProps> = ({ documents }) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<'semantic' | 'keyword'>('semantic');

  const predefinedQueries = [
    "Documenten met urgente deadlines",
    "Medische rapporten van deze maand",
    "Verzekeringsbriefen die nog in behandeling zijn",
    "Laboratorium uitslagen",
    "Documenten die aandacht vereisen"
  ];

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      // Simuleer AI search
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock search results met relevantie scoring
      const mockResults: SearchResult[] = documents.map(doc => ({
        document: doc,
        relevance: Math.random() * 100,
        summary: `Dit document bevat relevante informatie over ${searchQuery.toLowerCase()}. Automatisch gegenereerde samenvatting toont belangrijke details.`,
        keyPhrases: ['medisch rapport', 'patiënt gegevens', 'behandeling', 'diagnose']
      })).sort((a, b) => b.relevance - a.relevance);
      
      setSearchResults(mockResults);
      
      toast({
        title: "Zoekresultaten gevonden",
        description: `${mockResults.length} documenten gevonden voor "${searchQuery}"`,
      });
      
    } catch (error) {
      toast({
        title: "Zoekfout",
        description: "Er is een fout opgetreden tijdens het zoeken",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nieuw': return 'bg-blue-100 text-blue-800';
      case 'in_behandeling': return 'bg-yellow-100 text-yellow-800';
      case 'wacht_op_info': return 'bg-orange-100 text-orange-800';
      case 'afgehandeld': return 'bg-green-100 text-green-800';
      case 'geannuleerd': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <span>AI-Gestuurde Zoekfunctie</span>
          </CardTitle>
          <CardDescription>
            Gebruik natural language queries om documenten te vinden met semantische zoekfunctionaliteit
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Search Input */}
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button
                variant={searchMode === 'semantic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchMode('semantic')}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Semantisch
              </Button>
              <Button
                variant={searchMode === 'keyword' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchMode('keyword')}
              >
                <Search className="h-4 w-4 mr-2" />
                Trefwoord
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Input
                placeholder={
                  searchMode === 'semantic' 
                    ? "Bijvoorbeeld: 'Toon me alle urgente documenten van deze week'"
                    : "Zoek op trefwoorden..."
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button 
                onClick={() => handleSearch()}
                disabled={isSearching || !query.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSearching ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Zoeken...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Zoeken
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Predefined Queries */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Veelgebruikte zoekopdrachten:</h4>
            <div className="flex flex-wrap gap-2">
              {predefinedQueries.map((predefinedQuery, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery(predefinedQuery);
                    handleSearch(predefinedQuery);
                  }}
                  className="text-xs"
                >
                  {predefinedQuery}
                </Button>
              ))}
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Zoekresultaten ({searchResults.length})</h3>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filteren
                  </Button>
                  <Button variant="outline" size="sm">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Sorteren
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {searchResults.map((result, index) => (
                  <Card key={result.document.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{result.document.title}</h4>
                            <p className="text-sm text-gray-600">
                              {formatFileSize(result.document.file_size)} • {result.document.created_at.toLocaleDateString('nl-NL')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {Math.round(result.relevance)}% match
                          </Badge>
                          <Badge className={getStatusColor(result.document.status)}>
                            {result.document.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4">{result.summary}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {result.keyPhrases.map((phrase, phraseIndex) => (
                          <Badge key={phraseIndex} variant="secondary" className="text-xs">
                            {phrase}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {result.document.deadline && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Deadline: {result.document.deadline.toLocaleDateString('nl-NL')}</span>
                            </div>
                          )}
                        </div>
                        <Button variant="outline" size="sm">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          AI Chat over dit document
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* AI Features Info */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">AI Zoekfuncties</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-gray-800 mb-1">Semantische Zoeken</h5>
                <p className="text-gray-600">Begrijpt de betekenis van uw vraag en vindt relevante documenten</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-1">Cross-document Referenties</h5>
                <p className="text-gray-600">Vindt verbanden tussen verschillende documenten</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-1">Automatische Samenvatting</h5>
                <p className="text-gray-600">Genereert relevante samenvattingen van zoekresultaten</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-1">Sleutelwoord Extractie</h5>
                <p className="text-gray-600">Identificeert automatisch belangrijke termen</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
