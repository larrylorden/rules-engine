// client/src/components/TestInterface.tsx
import React, { useState } from 'react';
import { Container, Paper, Typography, Button, Grid } from '@mui/material';
import ProductPicker from './ProductPicker.tsx';
import { products as commonProducts } from '../data/products.ts';

// --- TypeScript Interfaces ---

interface RuleCondition {
  connector?: 'AND' | 'OR';
  codeGroup: 'customerCodes' | 'renewalCodes' | 'allCustomerCodes' | 'opportunityCodes';
  productGroupId: string;
  relationship: 'contains-any' | 'contains-all' | 'contains-some' | 'contains-none';
}

interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  startDate: string; // in YYYY-MM-DD format
  endDate: string;   // in YYYY-MM-DD format
  conditions: RuleCondition[];
  recommendationId: string;
}

interface ProductGroup {
  id: string;
  name: string;
  productCodes: string[];
}

interface Recommendation {
  id: string;
  name: string;
  url: string;
  score: number;
  isDefault: boolean;
}

interface TestResult {
  rule: Rule;
  marketingUrl: string;
}

// --- Helper Functions ---

// Get today's date in YYYY-MM-DD format
const getToday = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Evaluate a single condition given the selected codes, product group codes, and relationship type
const evaluateCondition = (selectedCodes: string[], groupCodes: string[], relationship: string): boolean => {
  switch (relationship) {
    case 'contains-any':
      return groupCodes.some(code => selectedCodes.includes(code));
    case 'contains-all':
      return groupCodes.every(code => selectedCodes.includes(code));
    case 'contains-some':
      return groupCodes.some(code => selectedCodes.includes(code)) &&
             !groupCodes.every(code => selectedCodes.includes(code));
    case 'contains-none':
      return groupCodes.every(code => !selectedCodes.includes(code));
    default:
      return false;
  }
};

// --- TestInterface Component ---

const TestInterface: React.FC = () => {
  const [customerCodes, setCustomerCodes] = useState<string[]>([]);
  const [renewalCodes, setRenewalCodes] = useState<string[]>([]);
  const [computedCodes, setComputedCodes] = useState<{
    customerCodes: string[];
    renewalCodes: string[];
    allCustomerCodes: string[];
    opportunityCodes: string[];
  } | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);

    // Compute code groups based on the current selections
    const allCustomerCodes = Array.from(new Set([...customerCodes, ...renewalCodes]));
    const opportunityCodes = renewalCodes.filter(code => !customerCodes.includes(code));
    const computed = { customerCodes, renewalCodes, allCustomerCodes, opportunityCodes };
    setComputedCodes(computed);

    // Fetch rules and product groups from the backend
    const rulesResponse = await fetch('http://localhost:5000/api/rules');
    const rules: Rule[] = await rulesResponse.json();
    const productGroupsResponse = await fetch('http://localhost:5000/api/product-groups');
    const productGroups: ProductGroup[] = await productGroupsResponse.json();

    const today = getToday();
    const firedResults: TestResult[] = [];

    // Evaluate each rule
    rules.forEach(rule => {
      // Check if the rule is enabled and active (date-wise)
      if (!rule.enabled) return;
      if (today < rule.startDate || today > rule.endDate) return;

      let overallResult: boolean | null = null;

      rule.conditions.forEach((cond, index) => {
        // Select the appropriate code group from the computed codes
        let selected: string[] = [];
        switch (cond.codeGroup) {
          case 'customerCodes':
            selected = computed.customerCodes;
            break;
          case 'renewalCodes':
            selected = computed.renewalCodes;
            break;
          case 'allCustomerCodes':
            selected = computed.allCustomerCodes;
            break;
          case 'opportunityCodes':
            selected = computed.opportunityCodes;
            break;
          default:
            selected = [];
        }

        // Look up the product group for this condition
        const pg = productGroups.find(pg => pg.id === cond.productGroupId);
        if (!pg) {
          console.warn(`Rule "${rule.name}" condition skipped: Product Group ${cond.productGroupId} not found.`);
          return;
        }

        // Evaluate this condition
        const conditionResult = evaluateCondition(selected, pg.productCodes, cond.relationship);
        console.log(
          `Rule "${rule.name}" condition ${index + 1}: [${cond.codeGroup}] vs Product Group (${pg.name}) with relationship "${cond.relationship}" yields ${conditionResult}`
        );

        // Combine condition results
        if (overallResult === null) {
          overallResult = conditionResult;
        } else {
          const connector = cond.connector || 'AND';
          if (connector === 'AND') {
            overallResult = overallResult && conditionResult;
          } else if (connector === 'OR') {
            overallResult = overallResult || conditionResult;
          }
        }
      });

      // If overall result is true, the rule fires
      if (overallResult) {
        firedResults.push({
          rule,
          marketingUrl: `https://marketing.example.com/${rule.id}`
        });
      }
    });

    setTestResults(firedResults);
    setLoading(false);
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Interface
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">Select Customer Codes</Typography>
            <ProductPicker
              products={commonProducts}
              selectedProducts={customerCodes}
              onSelectionChange={setCustomerCodes}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">Select Renewal Codes</Typography>
            <ProductPicker
              products={commonProducts}
              selectedProducts={renewalCodes}
              onSelectionChange={setRenewalCodes}
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" onClick={runTest} disabled={loading}>
              {loading ? 'Running Test...' : 'Run Test'}
            </Button>
          </Grid>
        </Grid>

        {computedCodes && (
          <Paper sx={{ mt: 3, p: 2 }} variant="outlined">
            <Typography variant="subtitle1">Computed Code Groups:</Typography>
            <Typography variant="body2">
              <strong>Customer Codes:</strong> {computedCodes.customerCodes.join(', ')}
            </Typography>
            <Typography variant="body2">
              <strong>Renewal Codes:</strong> {computedCodes.renewalCodes.join(', ')}
            </Typography>
            <Typography variant="body2">
              <strong>All Customer Codes:</strong> {computedCodes.allCustomerCodes.join(', ')}
            </Typography>
            <Typography variant="body2">
              <strong>Opportunity Codes:</strong> {computedCodes.opportunityCodes.join(', ')}
            </Typography>
          </Paper>
        )}

        <Paper sx={{ mt: 3, p: 2 }} variant="outlined">
          <Typography variant="subtitle1">Test Results:</Typography>
          {testResults.length === 0 ? (
            <Typography variant="body2">No rules fired.</Typography>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Rule Name</th>
                  <th>Marketing URL</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((result, index) => (
                  <tr key={index}>
                    <td>{result.rule.name}</td>
                    <td>
                      <a href={result.marketingUrl} target="_blank" rel="noopener noreferrer">
                        {result.marketingUrl}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Paper>
      </Paper>
    </Container>
  );
};

export default TestInterface;


