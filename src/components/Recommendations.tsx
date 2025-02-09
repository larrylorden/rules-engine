import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Radio,
  Grid
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

const API_URL = 'http://localhost:5000/api';

// Define the shape of a Recommendation
export interface Recommendation {
  id?: string; // Optional when creating a new recommendation
  name: string;
  url: string;
  score: number;
  isDefault: boolean;
}

// Define the props for the RecommendationForm component
interface RecommendationFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Recommendation) => void;
  initialData?: Recommendation;
}

const RecommendationForm: React.FC<RecommendationFormProps> = ({ open, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Recommendation>({
    name: '',
    url: '',
    score: 0,
    isDefault: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        url: initialData.url,
        score: initialData.score,
        isDefault: initialData.isDefault
      });
    } else {
      setFormData({ name: '', url: '', score: 0, isDefault: false });
    }
    setErrors({});
  }, [initialData, open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.url) {
      newErrors.url = 'URL is required';
    } else {
      const urlRegex = /^(https?:\/\/)?([\w\d-]+\.)+\w{2,}(\/.+)?$/;
      if (!urlRegex.test(formData.url)) {
        newErrors.url = 'Enter a valid URL';
      }
    }
    if (formData.score < 1 || formData.score > 100) {
      newErrors.score = 'Score must be between 1 and 100';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave({ ...formData, score: Number(formData.score) });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'score' ? Number(value) : value
    }));
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{initialData ? 'Edit Recommendation' : 'Add Recommendation'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="URL"
              name="url"
              value={formData.url}
              onChange={handleChange}
              fullWidth
              error={!!errors.url}
              helperText={errors.url}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Score"
              name="score"
              type="number"
              value={formData.score}
              onChange={handleChange}
              fullWidth
              error={!!errors.score}
              helperText={errors.score}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Radio
                  checked={formData.isDefault}
                  onChange={() => setFormData((prev) => ({ ...prev, isDefault: true }))}
                />
              }
              label="Set as Default"
            />
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

const Recommendations: React.FC = () => {
  const [data, setData] = useState<Recommendation[]>([]);
  const [openForm, setOpenForm] = useState<boolean>(false);
  const [editingRec, setEditingRec] = useState<Recommendation | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/recommendations`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching recommendations', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_URL}/recommendations/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting recommendation', error);
    }
  };

  const handleEdit = (rec: Recommendation) => {
    setEditingRec(rec);
    setOpenForm(true);
  };

  const handleAdd = () => {
    setEditingRec(null);
    setOpenForm(true);
  };

  const handleFormClose = () => {
    setOpenForm(false);
  };

  const handleFormSave = async (formData: Recommendation) => {
    try {
      if (editingRec && editingRec.id) {
        await fetch(`${API_URL}/recommendations/${editingRec.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch(`${API_URL}/recommendations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      setOpenForm(false);
      fetchData();
    } catch (error) {
      console.error('Error saving recommendation', error);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 2 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h6">Recommendations</Typography>
          </Grid>
          <Grid item>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
              Add Recommendation
            </Button>
          </Grid>
        </Grid>
        <Table sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>URL</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Default</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((rec) => (
              <TableRow key={rec.id}>
                <TableCell>{rec.name}</TableCell>
                <TableCell>{rec.url}</TableCell>
                <TableCell>{rec.score}</TableCell>
                <TableCell>
                  <Radio checked={rec.isDefault} disabled />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(rec)} title="Edit">
                    <EditIcon />
                  </IconButton>
                  {rec.id && (
                    <IconButton onClick={() => handleDelete(rec.id!)} title="Delete">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No recommendations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
      <RecommendationForm
        open={openForm}
        onClose={handleFormClose}
        onSave={handleFormSave}
        initialData={editingRec || undefined}
      />
    </Container>
  );
};

export default Recommendations;


