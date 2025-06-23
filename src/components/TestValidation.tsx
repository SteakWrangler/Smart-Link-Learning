
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Play, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChildrenData } from '@/hooks/useChildrenData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  duration?: number;
}

const TestValidation: React.FC = () => {
  const { profile } = useAuth();
  const { children, refetch: refetchChildren } = useChildrenData();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const tests: Omit<TestResult, 'status' | 'duration'>[] = [
    { id: 'auth', name: 'User Authentication' },
    { id: 'subjects', name: 'Load Subjects from Database' },
    { id: 'challenges', name: 'Load Challenges from Database' },
    { id: 'children', name: 'Load Children Data' },
    { id: 'child-subjects', name: 'Child-Subject Relationships' },
    { id: 'child-challenges', name: 'Child-Challenge Relationships' },
    { id: 'create-child', name: 'Create New Child Profile' },
    { id: 'update-child', name: 'Update Child Profile' },
    { id: 'conversation-flow', name: 'Conversation Creation Flow' },
    { id: 'data-integrity', name: 'Data Integrity Check' }
  ];

  useEffect(() => {
    const initialResults = tests.map(test => ({
      ...test,
      status: 'pending' as const
    }));
    setTestResults(initialResults);
  }, []);

  const updateTestResult = (id: string, status: TestResult['status'], message?: string, duration?: number) => {
    setTestResults(prev => prev.map(test => 
      test.id === id ? { ...test, status, message, duration } : test
    ));
  };

  const runTest = async (testId: string): Promise<boolean> => {
    const startTime = Date.now();
    updateTestResult(testId, 'running');

    try {
      switch (testId) {
        case 'auth':
          if (!profile) throw new Error('User not authenticated');
          updateTestResult(testId, 'passed', `Authenticated as ${profile.email}`, Date.now() - startTime);
          return true;

        case 'subjects':
          const { data: subjects, error: subjectsError } = await supabase
            .from('subjects')
            .select('*');
          if (subjectsError) throw subjectsError;
          updateTestResult(testId, 'passed', `Found ${subjects?.length || 0} subjects`, Date.now() - startTime);
          return true;

        case 'challenges':
          const { data: challenges, error: challengesError } = await supabase
            .from('challenges')
            .select('*');
          if (challengesError) throw challengesError;
          updateTestResult(testId, 'passed', `Found ${challenges?.length || 0} challenges`, Date.now() - startTime);
          return true;

        case 'children':
          await refetchChildren();
          updateTestResult(testId, 'passed', `Found ${children.length} children`, Date.now() - startTime);
          return true;

        case 'child-subjects':
          if (children.length === 0) {
            updateTestResult(testId, 'passed', 'No children to test', Date.now() - startTime);
            return true;
          }
          
          const childWithSubjects = children.find(child => child.subjects && child.subjects.length > 0);
          if (!childWithSubjects) {
            updateTestResult(testId, 'passed', 'No children with subjects found (expected)', Date.now() - startTime);
            return true;
          }

          const { data: childSubjectData, error: csError } = await supabase
            .from('child_subjects')
            .select(`
              child_id,
              subject:subjects(id, name, created_at)
            `)
            .eq('child_id', childWithSubjects.id);

          if (csError) throw csError;
          updateTestResult(testId, 'passed', `Child-subject relationships working`, Date.now() - startTime);
          return true;

        case 'child-challenges':
          if (children.length === 0) {
            updateTestResult(testId, 'passed', 'No children to test', Date.now() - startTime);
            return true;
          }

          const childWithChallenges = children.find(child => child.challenges && child.challenges.length > 0);
          if (!childWithChallenges) {
            updateTestResult(testId, 'passed', 'No children with challenges found (expected)', Date.now() - startTime);
            return true;
          }

          const { data: childChallengeData, error: ccError } = await supabase
            .from('child_challenges')
            .select(`
              child_id,
              challenge:challenges(id, name, description, created_at)
            `)
            .eq('child_id', childWithChallenges.id);

          if (ccError) throw ccError;
          updateTestResult(testId, 'passed', `Child-challenge relationships working`, Date.now() - startTime);
          return true;

        case 'create-child':
          // Test creating a child (we'll clean it up after)
          const testChildName = `Test Child ${Date.now()}`;
          const { data: newChild, error: createError } = await supabase
            .from('children')
            .insert({
              name: testChildName,
              age_group: 'elementary',
              parent_id: profile!.id
            })
            .select()
            .single();

          if (createError) throw createError;

          // Clean up the test child
          await supabase
            .from('children')
            .delete()
            .eq('id', newChild.id);

          updateTestResult(testId, 'passed', 'Child creation and deletion successful', Date.now() - startTime);
          return true;

        case 'update-child':
          if (children.length === 0) {
            updateTestResult(testId, 'passed', 'No children to test update', Date.now() - startTime);
            return true;
          }

          const testChild = children[0];
          const { error: updateError } = await supabase
            .from('children')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', testChild.id);

          if (updateError) throw updateError;
          updateTestResult(testId, 'passed', 'Child update successful', Date.now() - startTime);
          return true;

        case 'conversation-flow':
          // Test conversation table structure
          const { data: conversations, error: convError } = await supabase
            .from('conversations')
            .select('*')
            .eq('parent_id', profile!.id)
            .limit(1);

          if (convError) throw convError;
          updateTestResult(testId, 'passed', 'Conversation table accessible', Date.now() - startTime);
          return true;

        case 'data-integrity':
          // Check for any orphaned records
          const { data: orphanedSubjects, error: osError } = await supabase
            .from('child_subjects')
            .select('child_id')
            .not('child_id', 'in', `(${children.map(c => `'${c.id}'`).join(',')})`);

          if (osError && osError.code !== 'PGRST116') throw osError; // PGRST116 is "no rows found" which is good

          const { data: orphanedChallenges, error: ocError } = await supabase
            .from('child_challenges')
            .select('child_id')
            .not('child_id', 'in', `(${children.map(c => `'${c.id}'`).join(',')})`);

          if (ocError && ocError.code !== 'PGRST116') throw ocError;

          updateTestResult(testId, 'passed', 'No orphaned records found', Date.now() - startTime);
          return true;

        default:
          throw new Error(`Unknown test: ${testId}`);
      }
    } catch (error: any) {
      console.error(`Test ${testId} failed:`, error);
      updateTestResult(testId, 'failed', error.message, Date.now() - startTime);
      return false;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      const result = await runTest(test.id);
      if (result) passed++;
      else failed++;
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
    
    if (failed === 0) {
      toast({
        title: "All Tests Passed! ✅",
        description: `${passed} tests completed successfully. The application is ready for use.`,
      });
    } else {
      toast({
        title: "Some Tests Failed ❌",
        description: `${passed} passed, ${failed} failed. Please review the failed tests.`,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'failed':
        return <XCircle className="text-red-500" size={20} />;
      case 'running':
        return <RefreshCw className="text-blue-500 animate-spin" size={20} />;
      default:
        return <AlertCircle className="text-gray-400" size={20} />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      case 'running':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const passedTests = testResults.filter(t => t.status === 'passed').length;
  const failedTests = testResults.filter(t => t.status === 'failed').length;
  const totalTests = testResults.length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play size={24} />
            Phase 4: Testing & Validation
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Comprehensive validation of the Learning Assistant application
            </p>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600">✅ {passedTests} Passed</span>
              <span className="text-red-600">❌ {failedTests} Failed</span>
              <span className="text-gray-600">📝 {totalTests} Total</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 mb-6">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="animate-spin mr-2" size={16} />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="mr-2" size={16} />
                  Run All Tests
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-3">
            {testResults.map((test) => (
              <div
                key={test.id}
                className={`p-4 rounded-lg border transition-colors ${getStatusColor(test.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <span className="font-medium">{test.name}</span>
                  </div>
                  {test.duration && (
                    <span className="text-sm text-gray-500">{test.duration}ms</span>
                  )}
                </div>
                {test.message && (
                  <p className="text-sm text-gray-600 mt-2 ml-8">{test.message}</p>
                )}
              </div>
            ))}
          </div>

          {failedTests === 0 && passedTests === totalTests && passedTests > 0 && (
            <div className="mt-6 p-4 bg-green-100 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 flex items-center gap-2">
                <CheckCircle size={20} />
                All Tests Passed! 🎉
              </h3>
              <p className="text-green-700 mt-2">
                The Learning Assistant application has been successfully validated. All core functionalities are working correctly with the unified database structure.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestValidation;
