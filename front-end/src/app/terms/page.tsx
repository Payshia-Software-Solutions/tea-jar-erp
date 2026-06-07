"use client"

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
  const terms = [
    {
      section: "1. Acceptance of Terms",
      content: "By accessing and using BizzFlow, you agree to be bound by these Terms and Conditions. If you do not agree, please refrain from using the platform."
    },
    {
      section: "2. User Accounts",
      content: "Users are responsible for maintaining the confidentiality of their account credentials. Any activity occurring under your account is your sole responsibility."
    },
    {
      section: "3. Service Usage",
      content: "BizzFlow is provided for workshop management purposes. Any misuse, unauthorized access, or interference with the service is strictly prohibited."
    },
    {
      section: "4. Data Ownership",
      content: "You retain ownership of the data you input into the system. BizzFlow reserves the right to use anonymized data for service improvements."
    },
    {
      section: "5. Limitation of Liability",
      content: "BizzFlow shall not be liable for any indirect, incidental, or consequential damages arising from the use or inability to use the service."
    },
    {
      section: "6. Modifications",
      content: "We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms."
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
            <Scale className="w-6 h-6" />
            <span className="font-bold text-xl uppercase tracking-wider">BizzFlow Legal</span>
          </div>
        </div>

        <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b py-8 text-center">
            <CardTitle className="text-3xl font-bold">Terms and Conditions</CardTitle>
            <p className="text-muted-foreground mt-2 text-sm uppercase tracking-widest">Effective Date: April 26, 2026</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50 text-left border-b">
                    <th className="p-4 font-semibold text-sm uppercase tracking-wider w-1/3">Section</th>
                    <th className="p-4 font-semibold text-sm uppercase tracking-wider">Agreement Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {terms.map((term, index) => (
                    <tr key={index} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-bold text-foreground align-top">
                        {term.section}
                      </td>
                      <td className="p-4 text-muted-foreground leading-relaxed">
                        {term.content}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground py-4">
          &copy; {new Date().getFullYear()} BizzFlow Systems. All rights reserved.
        </p>
      </div>
    </div>
  );
}
