
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import type { Child, Subject, Challenge } from '@/types';

export const useChildrenData = () => {
  const { profile } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChildrenWithRelations = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      // First, get all children for this parent
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', profile.id)
        .order('created_at', { ascending: false });

      if (childrenError) throw childrenError;

      if (!childrenData || childrenData.length === 0) {
        setChildren([]);
        return;
      }

      // Get child IDs for batch queries
      const childIds = childrenData.map(child => child.id);

      // Fetch subjects for all children
      const { data: childSubjects, error: subjectsError } = await supabase
        .from('child_subjects')
        .select(`
          child_id,
          subject:subjects(id, name, created_at)
        `)
        .in('child_id', childIds);

      if (subjectsError) throw subjectsError;

      // Fetch challenges for all children
      const { data: childChallenges, error: challengesError } = await supabase
        .from('child_challenges')
        .select(`
          child_id,
          challenge:challenges(id, name, description, created_at)
        `)
        .in('child_id', childIds);

      if (challengesError) throw challengesError;

      // Combine the data
      const enrichedChildren: Child[] = childrenData.map(child => {
        const subjects = childSubjects
          ?.filter(cs => cs.child_id === child.id)
          ?.map(cs => cs.subject)
          ?.filter(Boolean) as Subject[] || [];

        const challenges = childChallenges
          ?.filter(cc => cc.child_id === child.id)
          ?.map(cc => cc.challenge)
          ?.filter(Boolean) as Challenge[] || [];

        return {
          ...child,
          subjects,
          challenges
        };
      });

      setChildren(enrichedChildren);
    } catch (error) {
      console.error('Error fetching children data:', error);
      toast({
        title: "Error",
        description: "Failed to load children data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchChildrenWithRelations();
    }
  }, [profile]);

  return {
    children,
    loading,
    refetch: fetchChildrenWithRelations
  };
};
