
import React, { useState, useEffect, useMemo } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

const CATEGORIES = [
  "Shirt", "T-Shirt", "Top", "Blouse", "Kurti", "Kurta",
  "Dress", "Gown", "Saree", "Lehenga", "Skirt", "Jeans",
  "Trousers", "Pants", "Shorts", "Leggings", "Jeggings",
  "Jacket", "Blazer", "Sweater", "Hoodie", "Coat",
  "Suit", "Ethnic Wear", "Traditional Wear", "Nightwear",
  "Sportswear", "Footwear", "Shoes", "Sandals", "Heels",
  "Sneakers", "Boots", "Slippers", "Accessories",
  "Bag", "Watch", "Belt", "Scarf", "Other"
];

const COLORS = [
  "Black", "White", "Grey", "Red", "Blue", "Navy Blue",
  "Sky Blue", "Green", "Dark Green", "Yellow", "Orange",
  "Pink", "Light Pink", "Purple", "Violet", "Brown",
  "Beige", "Cream", "Maroon", "Peach", "Lavender",
  "Turquoise", "Gold", "Silver", "Multicolor", "Other"
];

const FABRICS = [
  "Cotton", "Silk", "Denim", "Polyester", "Wool",
  "Linen", "Rayon", "Chiffon", "Georgette", "Velvet",
  "Satin", "Nylon", "Leather", "Lace", "Crepe",
  "Net", "Knitted", "Unknown", "Other"
];

const PATTERNS = [
  "Plain", "Printed", "Floral", "Striped", "Checked",
  "Polka Dot", "Geometric", "Abstract", "Embroidered",
  "Solid", "Graphic", "Traditional", "Other", "Unknown"
];

function getImageUrl(path) {
  if (!path) return "";

  if (
    path.startsWith("data:") ||
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${API}${path}`;
  }

  return `${API}/${path}`;
}

function App() {
  // Upload and AI analysis states
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [analysis, setAnalysis] = useState(null);

  const [category, setCategory] = useState("Other");
  const [color, setColor] = useState("Other");
  const [fabric, setFabric] = useState("Unknown");
  const [pattern, setPattern] = useState("Unknown");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Closet states
  const [closet, setCloset] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [colorFilter, setColorFilter] = useState("All");
  const [fabricFilter, setFabricFilter] = useState("All");
  const [patternFilter, setPatternFilter] = useState("All");

  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editCategory, setEditCategory] = useState("Other");
  const [editColor, setEditColor] = useState("Other");
  const [editFabric, setEditFabric] = useState("Unknown");
  const [editPattern, setEditPattern] = useState("Unknown");

  // Outfit recommendation states
  const [occasion, setOccasion] = useState("");
  const [recommendation, setRecommendation] = useState(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");
  const [variation, setVariation] = useState(0);

  // General messages
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Load closet when the application starts
  useEffect(() => {
    loadCloset();
  }, []);

  // Get saved clothing items
  async function loadCloset() {
    try {
      const response = await fetch(`${API}/clothing-items`);

      if (!response.ok) {
        throw new Error("Could not load your closet.");
      }

      const data = await response.json();

      setCloset(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(
        "Could not connect to the backend. Make sure FastAPI is running."
      );
    }
  }

  // Select an image
  function handleFileChange(event) {
    const file = event.target.files?.[0];

    setError("");
    setMessage("");
    setAnalysis(null);
    setSelectedFile(null);
    setPreview("");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();

    reader.onloadend = () => {
      setPreview(reader.result);
    };

    reader.onerror = () => {
      setError("Could not read the selected image.");
    };

    reader.readAsDataURL(file);
  }

  // Analyze clothing image using AI backend
  async function analyzeClothing() {
    if (!selectedFile) {
      setError("Please select a clothing image first.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API}/analyze-clothing`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Clothing analysis failed.");
      }

      const result = data.analysis || data;

      setAnalysis(result);
      setCategory(result.category || "Other");
      setColor(result.color || "Other");
      setFabric(result.fabric || "Unknown");
      setPattern(result.pattern || "Unknown");

      setMessage("Clothing image analyzed successfully.");
    } catch (err) {
      setError(err.message || "Could not analyze the image.");
    } finally {
      setLoading(false);
    }
  }

  // Save analyzed clothing to the closet
  async function saveToCloset() {
    if (!preview || !analysis) {
      setError("Please analyze an image before saving.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/clothing-items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          color,
          fabric,
          pattern,
          confidence: analysis.confidence ?? null,
          image_path: preview,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not save clothing item.");
      }

      setMessage("Clothing item saved to your Digital Closet!");

      setSelectedFile(null);
      setPreview("");
      setAnalysis(null);

      const fileInput = document.getElementById("clothing-upload");
      if (fileInput) fileInput.value = "";

      await loadCloset();
    } catch (err) {
      setError(err.message || "Could not save clothing item.");
    } finally {
      setSaving(false);
    }
  }

  // Start editing an item
  function startEditing(item) {
    setEditingId(item.id);
    setEditCategory(item.category || "Other");
    setEditColor(item.color || "Other");
    setEditFabric(item.fabric || "Unknown");
    setEditPattern(item.pattern || "Unknown");
    setError("");
    setMessage("");
  }

  // Save edited item
  async function saveEdit(item) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/clothing-items/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: editCategory,
          color: editColor,
          fabric: editFabric,
          pattern: editPattern,
          confidence: item.confidence ?? null,
          image_path: item.image_path || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not update item.");
      }

      setEditingId(null);
      setMessage("Closet item updated successfully.");

      await loadCloset();
    } catch (err) {
      setError(err.message || "Could not update item.");
    }
  }

  // Delete an item
  async function deleteItem(item) {
    if (!window.confirm("Are you sure you want to delete this closet item?")) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/clothing-items/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Could not delete item.");
      }

      setCloset((items) =>
        items.filter((entry) => entry.id !== item.id)
      );

      setMessage("Item deleted from your closet.");

      setRecommendation((current) => {
        if (!current) return current;

        return {
          ...current,
          outfit: (current.outfit || []).filter(
            (entry) => entry.id !== item.id
          ),
          outfits: (current.outfits || []).map((outfit) => ({
            ...outfit,
            items: (outfit.items || []).filter(
              (entry) => entry.id !== item.id
            ),
          })),
        };
      });
    } catch (err) {
      setError(err.message || "Could not delete item.");
    }
  }

  // Generate outfit recommendations
  async function getOutfitRecommendation(nextVariation = 0) {
    if (!occasion.trim()) {
      setRecommendationError("Please enter an occasion.");
      return;
    }

    setRecommendationLoading(true);
    setRecommendationError("");
    setRecommendation(null);
    setVariation(nextVariation);

    try {
      const response = await fetch(
        `${API}/recommend-outfit?occasion=${encodeURIComponent(
          occasion.trim()
        )}&variation=${nextVariation}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not generate an outfit recommendation."
        );
      }

      setRecommendation(data);
    } catch (err) {
      setRecommendationError(
        err.message || "Could not connect to the recommendation API."
      );
    } finally {
      setRecommendationLoading(false);
    }
  }

  // Search and filter closet items
  const filteredCloset = useMemo(() => {
    const query = search.trim().toLowerCase();

    return closet.filter((item) => {
      const searchableText = [
        item.category,
        item.color,
        item.fabric,
        item.pattern,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesCategory =
        categoryFilter === "All" || item.category === categoryFilter;

      const matchesColor =
        colorFilter === "All" || item.color === colorFilter;

      const matchesFabric =
        fabricFilter === "All" ||
        (item.fabric || "Unknown") === fabricFilter;

      const matchesPattern =
        patternFilter === "All" ||
        (item.pattern || "Unknown") === patternFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesColor &&
        matchesFabric &&
        matchesPattern
      );
    });
  }, [
    closet,
    search,
    categoryFilter,
    colorFilter,
    fabricFilter,
    patternFilter,
  ]);

  // Handle different recommendation response formats
  const recommendedOutfits = Array.isArray(recommendation?.outfits)
    ? recommendation.outfits
    : Array.isArray(recommendation?.outfit) &&
        recommendation.outfit.length > 0
      ? [{ outfit_number: 1, items: recommendation.outfit }]
      : [];

  return (
    <main className="app-container">

      {/* Header */}
      <header className="app-header">
        <p className="eyebrow">YOUR PERSONAL FASHION COMPANION</p>
        <h1>My Digital Closet</h1>
        <p>
          Upload, organize, and rediscover your wardrobe with AI.
        </p>
      </header>

      {/* General messages */}
      {error && (
        <div className="status-message error-message" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="status-message success-message" role="status">
          {message}
        </div>
      )}

      {/* Upload section */}
      <section className="upload-section">
        <h2>Add Clothing to Your Closet</h2>
        <p>
          Analyze an image, review its details, and save it to your wardrobe.
        </p>

        <label className="upload-label" htmlFor="clothing-upload">
          Choose Clothing Image
        </label>

        <input
          id="clothing-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
        />

        {preview && (
          <div className="analysis-layout">

            <div className="preview-panel">
              <img
                src={preview}
                alt="Selected clothing"
                className="preview-image"
              />
              <p className="muted-text">Selected image</p>
            </div>

            <div className="analysis-panel">
              <h3>Clothing Analysis</h3>

              {!analysis ? (
                <>
                  <p>Let AI predict the clothing category and color.</p>

                  <button
                    className="primary-button"
                    onClick={analyzeClothing}
                    disabled={loading}
                  >
                    {loading ? "Analyzing..." : "Analyze Image"}
                  </button>
                </>
              ) : (
                <>
                  <p className="muted-text">
                    AI prediction: {analysis.category || "Not detected"} ·{" "}
                    {analysis.color || "Unknown"}
                  </p>

                  <div className="form-field">
                    <label htmlFor="correct-category">Category</label>
                    <select
                      id="correct-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {CATEGORIES.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="correct-color">Color</label>
                    <select
                      id="correct-color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                    >
                      {COLORS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="correct-fabric">Fabric</label>
                    <select
                      id="correct-fabric"
                      value={fabric}
                      onChange={(e) => setFabric(e.target.value)}
                    >
                      {FABRICS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="correct-pattern">Pattern</label>
                    <select
                      id="correct-pattern"
                      value={pattern}
                      onChange={(e) => setPattern(e.target.value)}
                    >
                      {PATTERNS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>

                  {analysis.confidence != null && (
                    <p className="muted-text">
                      Model confidence:{" "}
                      {Number(analysis.confidence).toFixed(2)}%
                    </p>
                  )}

                  <button
                    className="primary-button"
                    onClick={saveToCloset}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save to My Closet"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Outfit recommendation section */}
      <section className="recommendation-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">STYLE IT WITH AI</p>
            <h2>Outfit Recommendations</h2>
            <p>
              Get outfit ideas using clothes saved in your Digital Closet.
            </p>
          </div>
        </div>

        <div className="recommendation-controls">
          <div className="form-field">
            <label htmlFor="occasion">Where are you going?</label>
            <input
              id="occasion"
              type="text"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              placeholder="Example: Office Wear, College, Party..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  getOutfitRecommendation(0);
                }
              }}
            />
          </div>

          <button
            className="primary-button"
            onClick={() => getOutfitRecommendation(0)}
            disabled={recommendationLoading}
          >
            {recommendationLoading
              ? "Creating your outfit..."
              : "Get Outfit Recommendation"}
          </button>
        </div>

        {recommendationError && (
          <div className="status-message error-message" role="alert">
            {recommendationError}
          </div>
        )}

        {recommendationLoading && (
          <p className="muted-text">
            Looking through your closet...
          </p>
        )}

        {recommendation && !recommendationLoading && (
          <div className="recommendation-result">
            <h3>Your {recommendation.occasion || occasion} outfit</h3>

            {recommendation.message && (
              <p className="recommendation-message">
                {recommendation.message}
              </p>
            )}

            {recommendedOutfits.length > 0 ? (
              <>
                {recommendedOutfits.map((outfit, outfitIndex) => (
                  <div
                    className="outfit-option"
                    key={outfit.outfit_number || outfitIndex}
                  >
                    <h3>
                      Outfit {outfit.outfit_number || outfitIndex + 1}
                    </h3>

                    <div className="recommendation-grid">
                      {(outfit.items || []).map((item, index) => (
                        <article
                          className="recommendation-card"
                          key={item.id ?? `${item.category}-${index}`}
                        >
                          {item.image_path ? (
                            <img
                              src={getImageUrl(item.image_path)}
                              alt={`${item.color || ""} ${
                                item.category || "Clothing item"
                              }`}
                              className="recommendation-image"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="image-placeholder">
                              No image available
                            </div>
                          )}

                          <div className="recommendation-card-content">
                            <h4>{item.category || "Clothing item"}</h4>
                            <p>Color: {item.color || "Unknown"}</p>
                            {item.fabric && <p>Fabric: {item.fabric}</p>}
                            {item.pattern && <p>Pattern: {item.pattern}</p>}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  className="generate-another-btn"
                  onClick={() =>
                    getOutfitRecommendation(variation + 1)
                  }
                  disabled={recommendationLoading}
                >
                  {recommendationLoading
                    ? "Generating..."
                    : "Generate Another Outfit"}
                </button>
              </>
            ) : (
              <div className="empty-closet">
                <h3>No outfit items were returned</h3>
                <p>
                  Add more clothing items to your closet and try again.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Digital Closet section */}
      <section className="closet-section">
        <div className="section-heading">
          <div>
            <h2>My Wardrobe</h2>
            <p>
              {closet.length} saved item
              {closet.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Search and filters */}
        <div className="closet-controls">
          <input
            type="search"
            placeholder="Search category, color, fabric or pattern..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search closet"
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value)}
            aria-label="Filter by color"
          >
            <option value="All">All colors</option>
            {COLORS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={fabricFilter}
            onChange={(e) => setFabricFilter(e.target.value)}
            aria-label="Filter by fabric"
          >
            <option value="All">All fabrics</option>
            {FABRICS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={patternFilter}
            onChange={(e) => setPatternFilter(e.target.value)}
            aria-label="Filter by pattern"
          >
            <option value="All">All patterns</option>
            {PATTERNS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        {/* Closet items */}
        {filteredCloset.length === 0 ? (
          <div className="empty-closet">
            <h3>
              {closet.length === 0
                ? "Your closet is empty"
                : "No matching items"}
            </h3>

            <p>
              {closet.length === 0
                ? "Analyze and save your first clothing image above."
                : "Try a different search or change your filters."}
            </p>
          </div>
        ) : (
          <div className="closet-grid">
            {filteredCloset.map((item) => (
              <article className="closet-card" key={item.id}>
                {item.image_path ? (
                  <img
                    src={getImageUrl(item.image_path)}
                    alt={`${item.color || ""} ${item.category || "Clothing"}`}
                    className="closet-image"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="image-placeholder">
                    No image available
                  </div>
                )}

                <div className="closet-card-content">
                  {editingId === item.id ? (
                    <>
                      <div className="form-field">
                        <label>Category</label>
                        <select
                          value={editCategory}
                          onChange={(e) =>
                            setEditCategory(e.target.value)
                          }
                        >
                          {CATEGORIES.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-field">
                        <label>Color</label>
                        <select
                          value={editColor}
                          onChange={(e) =>
                            setEditColor(e.target.value)
                          }
                        >
                          {COLORS.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-field">
                        <label>Fabric</label>
                        <select
                          value={editFabric}
                          onChange={(e) =>
                            setEditFabric(e.target.value)
                          }
                        >
                          {FABRICS.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-field">
                        <label>Pattern</label>
                        <select
                          value={editPattern}
                          onChange={(e) =>
                            setEditPattern(e.target.value)
                          }
                        >
                          {PATTERNS.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="button-row">
                        <button
                          className="primary-button"
                          onClick={() => saveEdit(item)}
                        >
                          Save Changes
                        </button>

                        <button
                          className="secondary-button"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3>{item.category || "Uncategorized"}</h3>
                      <p>Color: {item.color || "Unknown"}</p>
                      <p>Fabric: {item.fabric || "Not specified"}</p>
                      <p>Pattern: {item.pattern || "Not specified"}</p>

                      {item.confidence != null && (
                        <p className="muted-text">
                          AI confidence:{" "}
                          {Number(item.confidence).toFixed(2)}%
                        </p>
                      )}

                      <div className="button-row">
                        <button
                          className="secondary-button"
                          onClick={() => startEditing(item)}
                        >
                          Edit
                        </button>

                        <button
                          className="delete-button"
                          onClick={() => deleteItem(item)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}

export default App;
