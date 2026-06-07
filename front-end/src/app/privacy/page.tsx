"use client"

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ShieldCheck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPage() {
  const policies = [
    {
      topic: "Information Collection",
      details: "We collect information you provide directly to us, such as your name, email address, and workshop details when you register for an account."
    },
    {
      topic: "Data Usage",
      details: "Your information is used to provide, maintain, and improve our services, communicate with you, and ensure system security."
    },
    {
      topic: "Data Sharing",
      details: "We do not sell your personal data. We may share information with service providers who perform services on our behalf or as required by law."
    },
    {
      topic: "Security Measures",
      details: "We implement industry-standard security measures, including encryption and access controls, to protect your data from unauthorized access."
    },
    {
      topic: "Cookie Policy",
      details: "We use cookies to enhance your experience, remember your preferences, and analyze system performance. You can manage cookie settings in your browser."
    },
    {
      topic: "User Rights",
      details: "You have the right to access, correct, or delete your personal information. Contact our support team to exercise these rights."
    }
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/register">
            <Button variant="ghost" className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back to Registration
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-primary">
            <Lock className="w-6 h-6" />
            <span className="font-bold text-xl uppercase tracking-wider">BizzFlow Privacy</span>
          </div>
        </div>

        <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b py-8 text-center">
            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
            <p className="text-muted-foreground mt-2 text-sm uppercase tracking-widest">Last Updated: April 26, 2026</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50 text-left border-b">
                    <th className="p-4 font-semibold text-sm uppercase tracking-wider w-1/3">Topic</th>
                    <th className="p-4 font-semibold text-sm uppercase tracking-wider">Policy Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {policies.map((policy, index) => (
                    <tr key={index} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-bold text-foreground align-top flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        {policy.topic}
                      </td>
                      <td className="p-4 text-muted-foreground leading-relaxed">
                        {policy.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground py-4">
          Your privacy is our priority. BizzFlow Systems.
        </p>
      </div>
    </div>
  );
}
