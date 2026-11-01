class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.filterQuery = {};
  }

  // 1. FILTERING & SEARCH
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields", "search"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Advanced filtering: replace gte, gt, lte, lt, in, ne with $gte, $gt, etc.
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt|in|ne)\b/g,
      (match) => `$${match}`
    );

    const parsedFilter = JSON.parse(queryStr);

    // Keyword text search across common fields (originalName, title, text)
    if (this.queryString.search) {
      const searchRegex = { $regex: this.queryString.search, $options: "i" };
      parsedFilter.$or = [
        { originalName: searchRegex },
        { title: searchRegex },
        { text: searchRegex },
        { "analysis.title": searchRegex },
        { "prediction.title": searchRegex },
      ];
    }

    this.filterQuery = parsedFilter;
    this.query = this.query.find(parsedFilter);

    return this;
  }

  // 2. SORTING (e.g. ?sort=-createdAt or ?sort=fileSize,-createdAt)
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  // 3. FIELD LIMITING / PROJECTION (e.g. ?fields=originalName,status,fileSize)
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  // 4. PAGINATION (e.g. ?page=2&limit=10)
  paginate() {
    const page = Math.max(1, parseInt(this.queryString.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(this.queryString.limit, 10) || 10));
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;

