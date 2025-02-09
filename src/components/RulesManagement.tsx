import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Autocomplete
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';

const API_URL = 'http://localhost:5000/api';

// -------------------------------------------------------------------
// Helper Functions for Dates
// -------------------------------------------------------------------
const getToday = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getDate30DaysFromNow = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
};

// -------------------------------------------------------------------
// TypeScript Interfaces
// -------------------------------------------------------------------
export interface RuleCondition {
  connector?: 'AND' | 'OR';
  codeGroup: 'customerCodes' | 'renewalCodes' | 'allCustomerCodes' | 'opportunityCodes';
  productGroupId: string;
  relationship: 'contains-any' | 'contains-all' | 'contains-some' | 'contains-none';
}

export interface Recommendation {
  id: string;
  name: string;
  url: string;
  score: number;
  isDefault: boolean;
}

export interface Rule {
  id?: string;
  name: string;
  enabled: boolean;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  conditions: RuleCondition[];
  recommendationId: string; // New field to associate a Recommendation
}

interface RuleFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Rule) => void;
  initialData?: Rule;
  productGroups: { id: string; name: string }[];
  recommendations: Recommendation[];
}

// -------------------------------------------------------------------
// RuleForm Component (Modal for Add/Edit Rule)
// -------------------------------------------------------------------
const RuleForm: React.FC<RuleFormProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  productGroups,
  recommendations
}) => {
  // A default condition for new rules
  const defaultCondition: RuleCondition = {
    codeGroup: 'customerCodes',
    productGroupId: '',
    relationship: 'contains-any'
  };

  // Default dates: today and 30 days from today
  const defaultStartDate = getToday();
  const defaultEndDate = getDate30DaysFromNow();

  const [formData, setFormData] = useState<Rule>({
    name: '',
    enabled: false,
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    conditions: [defaultCondition],
    recommendationId: '' // Will be set below if recommendations exist
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [conditionsErrors, setConditionsErrors] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        enabled: false,
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        conditions: [defaultCondition],
        recommendationId: recommendations.length > 0 ? recommendations[0].id : ''
      });
    }
    setErrors({});
    setConditionsErrors('');
  }, [initialData, open, defaultStartDate, defaultEndDate, recommendations]);

  const validate = (): boolean => {
    let valid = true;
    const newErrors: Record<string, string> = {};
    if (!formData.name) {
      newErrors.name = 'Name is required';
      valid = false;
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start Date is required';
      valid = false;
    }
    if (!formData.endDate) {
      newErrors.endDate = 'End Date is required';
      valid = false;
    }
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End Date must be after Start Date';
      valid = false;
    }
    if (!formData.recommendationId) {
      newErrors.recommendationId = 'Recommendation is required';
      valid = false;
    }
    setErrors(newErrors);

    // Validate conditions – at least one condition is required and each must have a product group selected
    if (formData.conditions.length === 0) {
      setConditionsErrors('At least one condition is required');
      valid = false;
    } else {
      for (const cond of formData.conditions) {
        if (!cond.productGroupId) {
          setConditionsErrors('All conditions must have a product group selected');
          valid = false;
          break;
        }
      }
    }
    return valid;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(formData);
    }
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleConditionChange = (index: number, field: keyof RuleCondition, value: any) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      conditions: newConditions
    }));
  };

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, { ...defaultCondition, connector: 'AND' }]
    }));
  };

  const removeCondition = (index: number) => {
    const newConditions = formData.conditions.filter((_, idx) => idx !== index);
    setFormData(prev => ({
      ...prev,
      conditions: newConditions
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>{initialData ? 'Edit Rule' : 'Add Rule'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Rule Name */}
          <Grid item xs={12}>
            <TextField
              label="Rule Name"
              name="name"
              value={formData.name}
              onChange={handleFieldChange}
              fullWidth
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          {/* Dates */}
          <Grid item xs={12} sm={4}>
            <TextField
              label="Start Date"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleFieldChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={!!errors.startDate}
              helperText={errors.startDate}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="End Date"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleFieldChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={!!errors.endDate}
              helperText={errors.endDate}
            />
          </Grid>
          {/* Recommendation Selection */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={!!errors.recommendationId}>
              <InputLabel id="recommendation-label">Recommendation</InputLabel>
              <Select
                labelId="recommendation-label"
                value={formData.recommendationId}
                label="Recommendation"
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, recommendationId: e.target.value as string }))
                }
              >
                {recommendations.map(rec => (
                  <MenuItem key={rec.id} value={rec.id}>
                    {rec.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.recommendationId && (
                <Typography color="error" variant="caption">
                  {errors.recommendationId}
                </Typography>
              )}
            </FormControl>
          </Grid>
          {/* Enabled Checkbox */}
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Checkbox
                  name="enabled"
                  checked={formData.enabled}
                  onChange={handleFieldChange}
                />
              }
              label="Enabled"
            />
          </Grid>
          {/* Conditions */}
          <Grid item xs={12}>
            <Typography variant="subtitle1">Conditions</Typography>
            {conditionsErrors && (
              <Typography color="error" variant="body2">
                {conditionsErrors}
              </Typography>
            )}
            {formData.conditions.map((condition, index) => (
              <Grid container spacing={2} key={index} alignItems="center" sx={{ mt: 1 }}>
                {index > 0 && (
                  <Grid item xs={12} sm={2}>
                    <FormControl fullWidth>
                      <InputLabel id={`connector-label-${index}`}>Connector</InputLabel>
                      <Select
                        labelId={`connector-label-${index}`}
                        value={condition.connector || 'AND'}
                        label="Connector"
                        onChange={(e) =>
                          handleConditionChange(index, 'connector', e.target.value)
                        }
                      >
                        <MenuItem value="AND">AND</MenuItem>
                        <MenuItem value="OR">OR</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                <Grid item xs={12} sm={index > 0 ? 3 : 4}>
                  <FormControl fullWidth>
                    <InputLabel id={`codeGroup-label-${index}`}>Code Group</InputLabel>
                    <Select
                      labelId={`codeGroup-label-${index}`}
                      value={condition.codeGroup}
                      label="Code Group"
                      onChange={(e) =>
                        handleConditionChange(index, 'codeGroup', e.target.value)
                      }
                    >
                      <MenuItem value="customerCodes">customerCodes</MenuItem>
                      <MenuItem value="renewalCodes">renewalCodes</MenuItem>
                      <MenuItem value="allCustomerCodes">allCustomerCodes</MenuItem>
                      <MenuItem value="opportunityCodes">opportunityCodes</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {/* Relationship before Product Group */}
                <Grid item xs={12} sm={index > 0 ? 3 : 4}>
                  <FormControl fullWidth>
                    <InputLabel id={`relationship-label-${index}`}>Relationship</InputLabel>
                    <Select
                      labelId={`relationship-label-${index}`}
                      value={condition.relationship}
                      label="Relationship"
                      onChange={(e) =>
                        handleConditionChange(index, 'relationship', e.target.value)
                      }
                    >
                      <MenuItem value="contains-any">contains-any</MenuItem>
                      <MenuItem value="contains-all">contains-all</MenuItem>
                      <MenuItem value="contains-some">contains-some</MenuItem>
                      <MenuItem value="contains-none">contains-none</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={index > 0 ? 3 : 4}>
                  <Autocomplete
                    options={productGroups}
                    getOptionLabel={(option) => option.name}
                    value={
                      productGroups.find((pg) => pg.id === condition.productGroupId) || null
                    }
                    onChange={(event, newValue) => {
                      handleConditionChange(index, 'productGroupId', newValue ? newValue.id : '');
                    }}
                    renderInput={(params) => <TextField {...params} label="Product Group" />}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <IconButton
                    onClick={() => removeCondition(index)}
                    disabled={formData.conditions.length === 1}
                  >
                    <RemoveIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
            <Button onClick={addCondition} startIcon={<AddIcon />} sx={{ mt: 1 }}>
              Add Condition
            </Button>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// -------------------------------------------------------------------
// RulesManagement Component (Main Screen)
// -------------------------------------------------------------------
const RulesManagement: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [openForm, setOpenForm] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [productGroups, setProductGroups] = useState<{ id: string; name: string }[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const fetchRules = async () => {
    try {
      const response = await fetch(`${API_URL}/rules`);
      const result = await response.json();
      setRules(result);
    } catch (error) {
      console.error('Error fetching rules', error);
    }
  };

  const fetchProductGroups = async () => {
    try {
      const response = await fetch(`${API_URL}/product-groups`);
      const result = await response.json();
      const mapped = result.map((group: any) => ({ id: group.id, name: group.name }));
      setProductGroups(mapped);
    } catch (error) {
      console.error('Error fetching product groups', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`${API_URL}/recommendations`);
      const result = await response.json();
      setRecommendations(result);
    } catch (error) {
      console.error('Error fetching recommendations', error);
    }
  };

  useEffect(() => {
    fetchRules();
    fetchProductGroups();
    fetchRecommendations();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_URL}/rules/${id}`, { method: 'DELETE' });
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule', error);
    }
  };

  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    setOpenForm(true);
  };

  const handleAdd = () => {
    setEditingRule(null);
    setOpenForm(true);
  };

  const handleFormClose = () => {
    setOpenForm(false);
  };

  const handleFormSave = async (formData: Rule) => {
    try {
      if (editingRule && editingRule.id) {
        await fetch(`${API_URL}/rules/${editingRule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch(`${API_URL}/rules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      setOpenForm(false);
      fetchRules();
    } catch (error) {
      console.error('Error saving rule', error);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 2 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h6">Rules Management</Typography>
          </Grid>
          <Grid item>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
              Add Rule
            </Button>
          </Grid>
        </Grid>
        <Table sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Rule Name</TableCell>
              <TableCell>Enabled</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell># Conditions</TableCell>
              <TableCell>Recommendation</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>{rule.name}</TableCell>
                <TableCell>
                  <Checkbox checked={rule.enabled} disabled />
                </TableCell>
                <TableCell>{rule.startDate}</TableCell>
                <TableCell>{rule.endDate}</TableCell>
                <TableCell>{rule.conditions.length}</TableCell>
                <TableCell>
                  {recommendations.find(rec => rec.id === rule.recommendationId)?.name || 'N/A'}
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(rule)} title="Edit">
                    <EditIcon />
                  </IconButton>
                  {rule.id && (
                    <IconButton onClick={() => handleDelete(rule.id!)} title="Delete">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rules.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No rules found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
      <RuleForm
        open={openForm}
        onClose={handleFormClose}
        onSave={handleFormSave}
        initialData={editingRule || undefined}
        productGroups={productGroups}
        recommendations={recommendations}
      />
    </Container>
  );
};

export default RulesManagement;
