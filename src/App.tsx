/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider, useAuth } from './components/AuthProvider';
import Layout from './components/Layout';
import Home from './pages/Home';
import Lists from './pages/Lists';
import Plan from './pages/Plan';
import Journal from './pages/Journal';
import Settings from './pages/Settings';
import Routines from './pages/Routines';
import Challenges from './pages/Challenges';
import AICoach from './pages/AICoach';
import Health from './pages/Health';
import CycleTracking from './pages/CycleTracking';
import CycleInfo from './pages/CycleInfo';
import AddMeal from './pages/AddMeal';
import AssignMeal from './pages/AssignMeal';
import ShoppingList from './pages/ShoppingList';
import AddWorkout from './pages/AddWorkout';
import AssignWorkout from './pages/AssignWorkout';
import MealDetail from './pages/MealDetail';
import WorkoutDetail from './pages/WorkoutDetail';
import Sleep from './pages/Sleep';
import Nutrition from './pages/Nutrition';
import Activity from './pages/Activity';
import CyclePhaseDetail from './pages/CyclePhaseDetail';
import CreateRoutine from './pages/CreateRoutine';
import { LogIn, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/lists" element={<Lists />} />
              <Route path="/plan" element={<Plan />} />
              <Route path="/meal/:id" element={<MealDetail />} />
              <Route path="/workout/:id" element={<WorkoutDetail />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/create-routine" element={<CreateRoutine />} />
              <Route path="/routines" element={<Routines />} />
              <Route path="/challenges" element={<Challenges />} />
              <Route path="/ai-coach" element={<AICoach />} />
              <Route path="/health" element={<Health />} />
              <Route path="/health/cycle" element={<CycleTracking />} />
              <Route path="/health/cycle/info" element={<CycleInfo />} />
              <Route path="/health/cycle/phase/:phaseId" element={<CyclePhaseDetail />} />
              <Route path="/health/sleep" element={<Sleep />} />
              <Route path="/health/nutrition" element={<Nutrition />} />
              <Route path="/health/activity" element={<Activity />} />
              <Route path="/add-meal" element={<AddMeal />} />
              <Route path="/assign-meal" element={<AssignMeal />} />
              <Route path="/shopping-list" element={<ShoppingList />} />
              <Route path="/add-workout" element={<AddWorkout />} />
              <Route path="/assign-workout" element={<AssignWorkout />} />
              <Route path="/recipes" element={<div className="p-6"><h1>Recipes Page</h1><p>Coming soon!</p></div>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
