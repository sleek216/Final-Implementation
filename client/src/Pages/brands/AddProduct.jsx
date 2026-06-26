import React, { Component } from "react";
import "../../styles/brands/BrandDashboard.css";
import api from "../../api";
import { normalizeModel3DUrl } from "../../utils/model3d";

class AddProduct extends Component {
    state = {
        name: this.props.product?.name || "",
        productId: this.props.product?.productId || `FV-${Math.floor(100000 + Math.random() * 900000)}`,
        sku: this.props.product?.sku || "",
        category: this.props.product?.category?.name || this.props.product?.category || "",
        subCategory: this.props.product?.subCategory || "",
        description: this.props.product?.description || "",
        price: this.props.product?.price || "",
        stock: this.props.product?.stock || "",
        material: this.props.product?.material || "",
        selectedSizes: this.props.product?.sizes || [],
        selectedColors: this.props.product?.colors || ["#0ea5e9"],
        images: [], // New images to upload
        imagePreviews: (this.props.product?.images || []).map(img => `http://localhost:5005/uploads/${img}`),
        sizeChart: null,
        sizeChartPreview: this.props.product?.sizeChart ? `http://localhost:5005/uploads/${this.props.product.sizeChart}` : null,
        model3DUrl: normalizeModel3DUrl(this.props.product?.model3DUrl || ""),
        is3DEnabled: this.props.product?.is3DEnabled ?? !!normalizeModel3DUrl(this.props.product?.model3DUrl || ""),
        categories: [],
        masterColors: [],
        loadingCategories: true,
        loadingColors: true,
        publishing: false,
        currentStep: 1,
        isEdit: !!this.props.product
    };

    async componentDidMount() {
        this.fetchCategories();
        this.fetchColors();
    }

    fetchCategories = async () => {
        try {
            const res = await api.get("/products/categories");
            this.setState(prevState => ({
                categories: res.data,
                loadingCategories: false,
                category: (prevState.isEdit && prevState.category) ? prevState.category : (res.data.length > 0 ? res.data[0].name : "")
            }), this.setDefaultSubCategory);
        } catch (err) {
            console.error("Error fetching categories:", err);
            this.setState({ loadingCategories: false });
        }
    };

    fetchColors = async () => {
        try {
            const res = await api.get("/products/colors");
            this.setState({
                masterColors: res.data,
                loadingColors: false
            });
        } catch (err) {
            console.error("Error fetching colors:", err);
            this.setState({ loadingColors: false });
        }
    };

    getSubCategoriesForCategory = (categoryName) => {
        const categoryObj = this.state.categories.find(
            cat => cat.name === categoryName
        );
        return categoryObj ? categoryObj.subCategories : [];
    };

    setDefaultSubCategory = () => {
        if (!this.state.category) return;
        const availableSubCategories = this.getSubCategoriesForCategory(this.state.category);
        if (availableSubCategories.length > 0) {
            // Check if current subCategory is valid for the new category
            const subCatNames = availableSubCategories.map(s => s.name);
            if (!subCatNames.includes(this.state.subCategory)) {
                this.setState({ subCategory: subCatNames[0] });
            }
        } else {
            this.setState({ subCategory: "" });
        }
    };

    handleCategoryChange = (e) => {
        this.setState({ category: e.target.value }, this.setDefaultSubCategory);
    };

    handleInputChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    handleSizeToggle = (size) => {
        this.setState(prevState => ({
            selectedSizes: prevState.selectedSizes.includes(size)
                ? prevState.selectedSizes.filter(s => s !== size)
                : [...prevState.selectedSizes, size]
        }));
    };

    handleAddColor = (color) => {
        if (this.state.selectedColors.includes(color)) return;
        this.setState(prevState => ({
            selectedColors: [...prevState.selectedColors, color]
        }));
    };

    handleRemoveColor = (color) => {
        if (this.state.selectedColors.length <= 1) {
            alert("At least one color is required.");
            return;
        }
        this.setState(prevState => ({
            selectedColors: prevState.selectedColors.filter(c => c !== color)
        }));
    };

    handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + this.state.images.length > 5) {
            alert("Max 5 images allowed");
            return;
        }

        const newPreviews = files.map(file => URL.createObjectURL(file));
        this.setState(prevState => ({
            images: [...prevState.images, ...files],
            imagePreviews: [...prevState.imagePreviews, ...newPreviews]
        }));
    };

    handleSizeChartChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            this.setState({
                sizeChart: file,
                sizeChartPreview: URL.createObjectURL(file)
            });
        }
    };

    removeSizeChart = () => {
        this.setState({
            sizeChart: null,
            sizeChartPreview: null
        });
    };

    removeImage = (index) => {
        this.setState(prevState => ({
            images: prevState.images.filter((_, i) => i !== index),
            imagePreviews: prevState.imagePreviews.filter((_, i) => i !== index)
        }));
    };

    handleSubmit = async () => {
        const { name, productId, category, price, stock, images, isEdit } = this.state;
        if (!name || !productId || !category || !price || !stock) {
            alert("Please fill in all required fields (Name, Product ID, Category, Price, Stock)");
            return;
        }
        if (!isEdit && images.length === 0) {
            alert("Please upload at least one image");
            return;
        }

        this.setState({ publishing: true });

        try {
            const formData = new FormData();
            formData.append("name", this.state.name);
            formData.append("productId", this.state.productId);
            formData.append("sku", this.state.sku);
            formData.append("description", this.state.description);
            formData.append("price", this.state.price);
            formData.append("category", this.state.category);
            formData.append("subCategory", this.state.subCategory);
            formData.append("stock", this.state.stock);
            formData.append("sizes", JSON.stringify(this.state.selectedSizes));
            formData.append("colors", JSON.stringify(this.state.selectedColors));
            const normalized3DUrl = normalizeModel3DUrl(this.state.model3DUrl);
            formData.append("model3DUrl", normalized3DUrl);
            formData.append("is3DEnabled", String(!!normalized3DUrl && this.state.is3DEnabled));

            this.state.images.forEach(image => {
                formData.append("images", image);
            });

            if (this.state.sizeChart) {
                formData.append("sizeChart", this.state.sizeChart);
            }

            if (this.state.isEdit) {
                await api.put(`/brand/products/${this.props.product._id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                alert("Product updated successfully!");
            } else {
                await api.post("/brand/products", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                alert("Product published successfully!");
            }
            this.props.onBack(); // Go back to inventory
        } catch (err) {
            console.error("Error publishing product:", err);
            alert(err.response?.data?.message || "Failed to publish product");
        } finally {
            this.setState({ publishing: false });
        }
    };

    render() {
        const {
            name, productId, sku, category, subCategory, description, price, stock,
            material, selectedSizes, selectedColors, imagePreviews,
            sizeChartPreview, categories, loadingCategories,
            masterColors, loadingColors,
            publishing, currentStep, model3DUrl, is3DEnabled
        } = this.state;

        return (
            <div className="dash-wrapper">
                {/* HEADER */}
                <div className="subpage-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button className="icon-btn-v" onClick={this.props.onBack}>←</button>
                        <h1 style={{ fontSize: '20px' }}>{this.state.isEdit ? "Edit Product" : "Add New Product"}</h1>
                    </div>
                    <div className="dash-actions" style={{ alignItems: 'center' }}>
                        <button className="link-btn-v" onClick={this.props.onBack}>Cancel</button>
                        <button
                            className={`primary-btn ${this.state.isEdit ? 'edit-mode' : ''}`}
                            style={{ padding: '10px 24px', background: this.state.isEdit ? '#0ea5e9' : '#111827' }}
                            onClick={this.handleSubmit}
                            disabled={publishing}
                        >
                            {publishing ? (this.state.isEdit ? "Updating..." : "Publishing...") : (this.state.isEdit ? "Update Changes" : "Publish Product")}
                        </button>
                    </div>
                </div>

                {/* STEPS INDICATOR */}
                <div className="steps-container-v">
                    {[
                        { n: 1, label: 'Basis Info' },
                        { n: 2, label: 'Pricing & Stock' },
                        { n: 3, label: 'Product Assets' },
                        { n: 4, label: 'Attributes' }
                    ].map((s) => (
                        <div className={`step-item-v ${currentStep === s.n ? 'active' : ''}`} key={s.n}>
                            <div className="step-circle-v" style={{ background: this.state.isEdit && currentStep === s.n ? '#0ea5e9' : '' }}>{s.n}</div>
                            <span className="step-label-v">{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* SECTION 1: BASIC INFO */}
                <div className="form-section">
                    <div className="section-title-v">
                        <span className="section-icon-v">❶</span> 1. Basic Information
                    </div>
                    <div className="form-grid-v">
                        <div className="form-group-v full-width">
                            <label className="label-v">Product Title</label>
                            <input
                                type="text"
                                name="name"
                                value={name}
                                onChange={this.handleInputChange}
                                className="input-v"
                                placeholder="e.g. Neon-Void Puffer [Holo]"
                            />
                        </div>
                        <div className="form-group-v">
                            <label className="label-v">Product ID</label>
                            <input
                                type="text"
                                name="productId"
                                value={productId}
                                onChange={this.handleInputChange}
                                className="input-v"
                                placeholder="Enter custom Product ID"
                                required
                            />
                        </div>
                        <div className="form-group-v">
                            <label className="label-v">SKU (Internal Use)</label>
                            <input
                                type="text"
                                name="sku"
                                value={sku}
                                onChange={this.handleInputChange}
                                className="input-v"
                                placeholder="FV-XXXX-XXX"
                            />
                        </div>
                        <div className="form-group-v">
                            <label className="label-v">Category</label>
                            <select
                                name="category"
                                value={category}
                                onChange={this.handleCategoryChange}
                                className="select-v"
                            >
                                {loadingCategories ? (
                                    <option>Loading...</option>
                                ) : (
                                    categories.map(cat => (
                                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                                    ))
                                )}
                            </select>
                        </div>
                        {this.getSubCategoriesForCategory(category).length > 0 && (
                            <div className="form-group-v">
                                <label className="label-v">SubCategory</label>
                                <select
                                    name="subCategory"
                                    value={subCategory}
                                    onChange={this.handleInputChange}
                                    className="select-v"
                                >
                                    {this.getSubCategoriesForCategory(category).map((subCat) => (
                                        <option key={subCat._id} value={subCat.name}>{subCat.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="form-group-v full-width">
                            <label className="label-v">Description</label>
                            <textarea
                                name="description"
                                value={description}
                                onChange={this.handleInputChange}
                                className="textarea-v"
                                placeholder="Describe the material, fit, and digital features..."
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: PRICING & STOCK */}
                <div className="form-section">
                    <div className="section-title-v">
                        <span className="section-icon-v">❷</span> 2. Pricing & Stock
                    </div>
                    <div className="form-grid-v">
                        <div className="form-group-v">
                            <label className="label-v">Price (Rs.)</label>
                            <input
                                type="number"
                                name="price"
                                value={price}
                                onChange={this.handleInputChange}
                                className="input-v"
                                placeholder="0"
                            />
                        </div>
                        <div className="form-group-v">
                            <label className="label-v">Initial Inventory Level</label>
                            <input
                                type="number"
                                name="stock"
                                value={stock}
                                onChange={this.handleInputChange}
                                className="input-v"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>

                {/* SECTION 3: PRODUCT ASSETS */}
                <div className="form-section">
                    <div className="section-title-v">
                        <span className="section-icon-v">❸</span> 3. Product Assets
                    </div>
                    <div className="form-group-v">
                        <label className="label-v">High-Res 2D Images (Max 5)</label>
                        <div style={{ display: 'flex', gap: '15px', marginTop: '10px', flexWrap: 'wrap' }}>
                            <label className="upload-placeholder-v" style={{ flex: '1 1 300px', padding: '30px', cursor: 'pointer' }}>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={this.handleImageChange}
                                />
                                <span style={{ fontSize: '24px' }}>📄</span>
                                <div className="upload-text-v">
                                    <div className="upload-title-v">Click to upload images</div>
                                    <div className="upload-hint-v">PNG, JPG up to 10MB</div>
                                </div>
                            </label>

                            {imagePreviews.map((preview, index) => (
                                <div key={index} style={{ position: 'relative' }}>
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        style={{ width: '80px', height: '80px', borderRadius: '4px', objectFit: 'cover' }}
                                    />
                                    <button
                                        onClick={() => this.removeImage(index)}
                                        style={{
                                            position: 'absolute',
                                            top: '-5px',
                                            right: '-5px',
                                            background: '#ef4444',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '20px',
                                            height: '20px',
                                            fontSize: '12px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}

                            {imagePreviews.length < 5 && (
                                <label className="product-img-v" style={{ width: '80px', height: '80px', borderRadius: '4px', border: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#94a3b8', cursor: 'pointer' }}>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={this.handleImageChange}
                                    />
                                    +
                                </label>
                             )}
                        </div>
                    </div>

                    <div className="form-group-v" style={{ marginTop: '20px' }}>
                        <label className="label-v">3D Model URL (GLTF / GLB / Embed URL)</label>
                        <input
                            type="text"
                            name="model3DUrl"
                            value={model3DUrl}
                            onChange={(e) => {
                                const value = e.target.value;
                                const normalized = normalizeModel3DUrl(value);
                                this.setState({
                                    model3DUrl: value,
                                    is3DEnabled: normalized ? (this.state.is3DEnabled || !this.state.model3DUrl.trim()) : false
                                });
                            }}
                            onBlur={(e) => {
                                const normalized = normalizeModel3DUrl(e.target.value);
                                if (normalized !== e.target.value) {
                                    this.setState({ model3DUrl: normalized });
                                }
                            }}
                            className="input-v"
                            placeholder="e.g., https://modelviewer.dev/shared-assets/models/Astronaut.glb or Sketchfab embed link"
                        />
                        <div
                            className="toggle-3d-row"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginTop: '14px',
                                padding: '12px 14px',
                                borderRadius: '10px',
                                border: '1px solid #e2e8f0',
                                background: '#f8fafc'
                            }}
                        >
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Enable 3D View Button</div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                    Show the 3D preview button to customers on the product page.
                                </div>
                            </div>
                            <label className="toggle-3d-switch" style={{ position: 'relative', width: '48px', height: '26px', flexShrink: 0 }}>
                                <input
                                    type="checkbox"
                                    checked={is3DEnabled}
                                    disabled={!model3DUrl.trim()}
                                    onChange={(e) => this.setState({ is3DEnabled: e.target.checked })}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        borderRadius: '999px',
                                        background: is3DEnabled && model3DUrl.trim() ? '#0ea5e9' : '#cbd5e1',
                                        transition: '0.2s',
                                        cursor: model3DUrl.trim() ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: '3px',
                                            left: is3DEnabled && model3DUrl.trim() ? '25px' : '3px',
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            background: '#fff',
                                            transition: '0.2s',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                        }}
                                    />
                                </span>
                            </label>
                        </div>
                        <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                            Add a .glb/.gltf file URL or Sketchfab embed link, then enable the toggle so customers can open an interactive 3D preview.
                        </p>
                    </div>
                </div>

                {/* SECTION 4: ATTRIBUTES */}
                <div className="form-section">
                    <div className="section-title-v">
                        <span className="section-icon-v">❹</span> 4. Attributes
                    </div>
                    <div className="form-grid-v">
                        <div className="form-group-v">
                            <label className="label-v">Fabric/Material</label>
                            <input
                                type="text"
                                name="material"
                                value={material}
                                onChange={this.handleInputChange}
                                className="input-v"
                                placeholder="e.g. Liquid Silk, Carbon Fiber"
                            />
                        </div>
                        <div className="form-group-v">
                            <label className="label-v">Size Options</label>
                            <div className="variation-group-v">
                                {['XS', 'S', 'M', 'L', 'XL', 'One Size'].map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        className={`size-btn-v ${selectedSizes.includes(s) ? 'active' : ''}`}
                                        onClick={() => this.handleSizeToggle(s)}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="form-group-v full-width">
                            <label className="label-v">Product Colors</label>
                            <div className="colors-management-v" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div className="selected-colors-list" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {selectedColors.map((c, i) => {
                                        const masterColor = masterColors.find(mc => mc.name === c);
                                        return (
                                            <div key={i} className="color-badge-v" style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px', 
                                                background: '#f8fafc', 
                                                padding: '5px 12px', 
                                                borderRadius: '20px', 
                                                border: '1px solid #e2e8f0',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                            }}>
                                                <div style={{ 
                                                    width: '15px', 
                                                    height: '15px', 
                                                    borderRadius: '50%', 
                                                    background: masterColor?.hexCode || '#ddd', 
                                                    border: '1px solid #ddd' 
                                                }}></div>
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>{c}</span>
                                                <button 
                                                    type="button"
                                                    onClick={() => this.handleRemoveColor(c)}
                                                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '14px', padding: '0 2px' }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                <div className="master-colors-selection" style={{ marginTop: '5px' }}>
                                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>Select from standard colors:</p>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        {loadingColors ? (
                                            <span style={{ fontSize: '12px' }}>Loading colors...</span>
                                        ) : (
                                            masterColors.map(color => (
                                                <button
                                                    key={color._id}
                                                    type="button"
                                                    onClick={() => this.handleAddColor(color.name)}
                                                    className={`master-color-option ${selectedColors.includes(color.name) ? 'selected' : ''}`}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        border: selectedColors.includes(color.name) ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                                        background: selectedColors.includes(color.name) ? '#eff6ff' : '#fff',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: color.hexCode, border: '1px solid #ddd' }}></span>
                                                    {color.name}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                    {masterColors.length === 0 && !loadingColors && (
                                        <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '5px' }}>
                                            ⚠️ No standard colors defined by Admin yet.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SIZE CHART UPLOAD */}
                        <div className="form-group-v full-width" style={{ marginTop: '20px' }}>
                            <label className="label-v">Size Chart (Image)</label>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                                <label className="upload-placeholder-v" style={{ flex: '0 0 auto', width: '200px', height: '100px', padding: '10px', cursor: 'pointer', borderStyle: 'dashed' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={this.handleSizeChartChange}
                                    />
                                    <span style={{ fontSize: '20px' }}>📏</span>
                                    <div className="upload-text-v">
                                        <div className="upload-title-v" style={{ fontSize: '11px' }}>Upload Size Chart</div>
                                    </div>
                                </label>

                                {sizeChartPreview && (
                                    <div style={{ position: 'relative' }}>
                                        <img
                                            src={sizeChartPreview}
                                            alt="Size Chart"
                                            style={{ height: '100px', borderRadius: '4px', objectFit: 'contain', background: '#f8fafc', border: '1px solid #e2e8f0' }}
                                        />
                                        <button
                                            onClick={this.removeSizeChart}
                                            style={{
                                                position: 'absolute',
                                                top: '-8px',
                                                right: '-8px',
                                                background: '#ef4444',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '24px',
                                                height: '24px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '5px' }}>
                                Tip: Upload a clear image showing dimensions for each size to reduce returns.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="footer-actions-v" style={{ border: 'none' }}>
                    <button className="link-btn-v" onClick={this.props.onBack}>Cancel</button>
                    <button
                        className="primary-btn"
                        style={{ padding: '12px 32px' }}
                        onClick={this.handleSubmit}
                        disabled={publishing}
                    >
                        {publishing ? (this.state.isEdit ? "Updating..." : "Publishing...") : (this.state.isEdit ? "Update Product" : "Publish Product to Store")}
                    </button>
                </div>
            </div>
        );
    }
}

export default AddProduct;
