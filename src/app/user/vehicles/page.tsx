'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
  Car, Plus, Edit, Trash2, Shield, Calendar, Fuel,
  Gauge, Users, ChevronDown, Eye, FileText, Loader2, Search, AlertCircle,
  Camera, Upload, X, Image as ImageIcon, Brain, TrendingUp, AlertTriangle as AlertTriangleIcon
} from 'lucide-react';
import LicenseScanButton, { type ScanResult } from '@/components/ui/LicenseScanButton';

interface Vehicle {
  id: string;
  nickname: string;
  manufacturer: string;
  model: string;
  year: number;
  licensePlate: string;
  color?: string;
  mileage?: number;
  fuelType?: string;
  testStatus: string;
  testExpiryDate?: string;
  insuranceStatus: string;
  insuranceExpiry?: string;
  isPrimary: boolean;
  _count?: { inspections: number; sosEvents: number; expenses: number };
  drivers?: { id: string; driverName: string }[];
}

// Vehicle image component with fallback
function VehicleImage({ vehicleId, size = 'md', className = '' }: { vehicleId: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Check if image exists by trying to load it
    const extensions = ['jpeg', 'png', 'webp'];
    let found = false;
    let checked = 0;


