// client/src/components/ProductGroups.tsx
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
  Grid,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import ProductPicker from './ProductPicker.tsx';
import { products as commonProducts, Product } from '../data/products.ts';

export interface ProductGroup {
  id: string;
  name: string;
  productCodes: string[];
}

interface ProductGroupFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<ProductGroup, 'id'>) => void;
  initialData?: ProductGroup;
}

const ProductGroupForm: React.FC<ProductGroupFormProps> = ({ open, onClose, onSave, initialData }) => {
  const [groupName, setGroupName] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setGroupName(initialData.name);
      setSelectedProducts(initialData.productCodes);
    } else {
      setGroupName('');
      setSelectedProducts([]);
    }
  }, [initialData, open]);

  const handleSave = () => {
    if (!groupName || groupName.length < 2 || groupName.length > 50) {
      alert('Group name must be between 2 and 50 characters');
      return;
    }
    if (selectedProducts.length < 1 || selectedProducts.length > 100) {
      alert('Select between 1 and 100 products');
      return;
    }
    onSave({ name: groupName, productCodes: selectedProducts });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{initialData ? 'Edit Product Group' : 'Add Product Group'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              label="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <ProductPicker
              products={commonProducts}
              selectedProducts={selectedProducts}
              onSelectionChange={setSelectedProducts}
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

const ProductGroups: React.FC = () => {
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [openForm, setOpenForm] = useState<boolean>(false);
  const [editingGroup, setEditingGroup] = useState<ProductGroup | null>(null);

  const fetchGroups = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/product-groups');
      const result = await response.json();
      setGroups(result);
    } catch (error) {
      console.error('Error fetching product groups:', error);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`http://localhost:5000/api/product-groups/${id}`, { method: 'DELETE' });
      fetchGroups();
    } catch (error) {
      console.error('Error deleting product group:', error);
    }
  };

  const handleEdit = (group: ProductGroup) => {
    setEditingGroup(group);
    setOpenForm(true);
  };

  const handleAdd = () => {
    setEditingGroup(null);
    setOpenForm(true);
  };

  const handleFormSave = async (formData: Omit<ProductGroup, 'id'>) => {
    try {
      if (editingGroup) {
        await fetch(`http://localhost:5000/api/product-groups/${editingGroup.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch(`http://localhost:5000/api/product-groups`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      setOpenForm(false);
      fetchGroups();
    } catch (error) {
      console.error('Error saving product group:', error);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 2 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h6">Product Groups</Typography>
          </Grid>
          <Grid item>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
              Add Product Group
            </Button>
          </Grid>
        </Grid>
        <Table sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Group Name</TableCell>
              <TableCell># Products</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id}>
                <TableCell>{group.name}</TableCell>
                <TableCell>{group.productCodes.length}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(group)} title="Edit">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(group.id)} title="Delete">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {groups.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No product groups found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
      <ProductGroupForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSave={handleFormSave}
        initialData={editingGroup || undefined}
      />
    </Container>
  );
};

export default ProductGroups;
