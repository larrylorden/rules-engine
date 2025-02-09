// client/src/components/ProductPicker.tsx
import React, { useState } from 'react';
import { Product } from '../data/products';
import {
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Tooltip,
    Checkbox,
    TextField,
    Switch,
    FormControlLabel,
    Paper
} from '@mui/material';

interface ProductPickerProps {
    products: Product[];
    selectedProducts: string[]; // Array of product codes
    onSelectionChange: (selected: string[]) => void;
}

const ProductPicker: React.FC<ProductPickerProps> = ({
    products,
    selectedProducts,
    onSelectionChange
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showOnlySelected, setShowOnlySelected] = useState(false);

    // Filter products based on the search term and "show only selected" toggle.
    const filteredProducts = products.filter(product => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.code.toLowerCase().includes(searchTerm.toLowerCase());
        if (showOnlySelected) {
            return matchesSearch && selectedProducts.includes(product.code);
        }
        return matchesSearch;
    });

    // Determine if all filtered items are selected
    const allFilteredSelected =
        filteredProducts.length > 0 &&
        filteredProducts.every(product => selectedProducts.includes(product.code));

    const someFilteredSelected =
        filteredProducts.some(product => selectedProducts.includes(product.code)) &&
        !allFilteredSelected;

    // Handler for toggling a single product's selection.
    const handleToggleProduct = (code: string) => {
        if (selectedProducts.includes(code)) {
            onSelectionChange(selectedProducts.filter(c => c !== code));
        } else {
            onSelectionChange([...selectedProducts, code]);
        }
    };

    // Handler for the header "Select All" checkbox.
    const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // Add all filtered product codes to the selection (ensuring uniqueness).
            const newSelection = Array.from(
                new Set([...selectedProducts, ...filteredProducts.map(p => p.code)])
            );
            onSelectionChange(newSelection);
        } else {
            // Remove all filtered product codes from the selection.
            const newSelection = selectedProducts.filter(
                code => !filteredProducts.some(p => p.code === code)
            );
            onSelectionChange(newSelection);
        }
    };

    return (
        <Paper sx={{ padding: 2 }}>
            <TextField
                label="Search Products"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                margin="normal"
            />
            <FormControlLabel
                control={
                    <Switch
                        checked={showOnlySelected}
                        onChange={(e) => setShowOnlySelected(e.target.checked)}
                    />
                }
                label="Show Only Selected"
            />
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ padding: '4px 8px' }}>
                            <Tooltip title="Select/Deselect All">
                                <Checkbox
                                    checked={allFilteredSelected}
                                    indeterminate={someFilteredSelected}
                                    onChange={handleSelectAllChange}
                                />
                            </Tooltip>
                        </TableCell>

                        <TableCell sx={{ padding: '4px 8px' }}>Product Code</TableCell>
                        <TableCell sx={{ padding: '4px 8px' }}>Product Name</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {filteredProducts.map(product => (
                        <TableRow key={product.code}>
                            <TableCell sx={{ padding: '4px 8px' }}>
                                <Checkbox
                                    checked={selectedProducts.includes(product.code)}
                                    onChange={() => handleToggleProduct(product.code)}
                                />
                            </TableCell>
                            <TableCell sx={{ padding: '4px 8px' }}>{product.code}</TableCell>
                            <TableCell sx={{ padding: '4px 8px' }}>{product.name}</TableCell>
                        </TableRow>
                    ))}
                    {filteredProducts.length === 0 && (
                        <TableRow>
                            <TableCell sx={{ padding: '4px 8px' }} colSpan={3} align="center">
                                No products found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Paper>
    );
};

export default ProductPicker;