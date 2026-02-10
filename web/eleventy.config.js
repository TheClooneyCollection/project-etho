export default function (eleventyConfig) {
  eleventyConfig.addGlobalData(
    "environment",
    process.env.ELEVENTY_ENV || "development"
  );

  eleventyConfig.addPassthroughCopy("src/assets");

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
}
