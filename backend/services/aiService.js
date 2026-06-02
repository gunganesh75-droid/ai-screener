import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// MODEL SELECTION
// Use gemini-2.0-flash (stable, fast, multimodal — supports inline PDF)
// gemini-1.5-flash is deprecated and no longer available.
// ─────────────────────────────────────────────────────────────────────────────
const GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Extract text from a PDF resume file.
 * Sends the PDF directly to Gemini as base64 inlineData for native parsing.
 * This bypasses the legacy `pdf-parse` library which fails on many modern PDFs.
 *
 * @param {string} filePath - Absolute or relative path to the PDF file
 * @returns {Promise<string>} - Extracted text content
 */
export const extractTextFromPDF = async (filePath) => {
  const apiKey = process.env.GEMINI_API_KEY;

  // If no API key is configured, fall back to a basic local text extraction attempt
  if (!apiKey || apiKey.includes('YOUR_GEMINI_API_KEY')) {
    return extractTextLocalFallback(filePath);
  }

  try {
    const pdfBuffer = fs.readFileSync(filePath);
    const pdfBase64 = pdfBuffer.toString('base64');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: pdfBase64,
        },
      },
      {
        text: 'Extract all the text content from this PDF resume. Return the raw text only, preserving the structure (skills, experience, education, projects, etc.). Do not summarize or analyze — just return the full extracted text.',
      },
    ]);

    const response = await result.response;
    const extractedText = response.text().trim();
    console.log(`PDF text extracted via Gemini. Length: ${extractedText.length} chars.`);
    return extractedText;
  } catch (error) {
    console.error('Gemini PDF extraction failed, trying local fallback:', error.message);
    return extractTextLocalFallback(filePath);
  }
};

/**
 * Local fallback: attempts to read PDF text using the legacy pdf-parse library.
 * This may fail on newer or complex PDFs.
 * @param {string} filePath
 * @returns {Promise<string>}
 */
const extractTextLocalFallback = async (filePath) => {
  try {
    // Dynamically import pdf-parse to avoid top-level ESM issues
    const { default: pdf } = await import('pdf-parse/lib/pdf-parse.js');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text || '';
  } catch (error) {
    console.error('Local PDF fallback also failed:', error.message);
    throw new Error(
      'Failed to parse PDF resume. The file may be corrupted, password-protected, or use an unsupported format. Please upload a standard, text-based PDF.'
    );
  }
};

/**
 * Analyze resume text against job description using Gemini AI (with robust local fallback).
 * @param {string} resumeText - Extracted resume text
 * @param {string} jobDescription - Job description text
 * @param {Array<string>} skillsRequired - Array of required skills
 * @returns {Promise<object>} - AI analysis result object
 */
export const analyzeResume = async (resumeText, jobDescription, skillsRequired = []) => {
  const prompt = `
Compare the following resume with the job description and required skills.

JOB DESCRIPTION:
${jobDescription}

REQUIRED SKILLS:
${skillsRequired.join(', ')}

RESUME:
${resumeText}

Analyze the following dimensions:
1. Skill matching (which required skills are present and which are missing)
2. Experience relevance and years of experience
3. Education relevance
4. Overall candidate suitability for the role

Return ONLY a valid JSON object. Do NOT wrap it in markdown code blocks or add any introductory text. Return raw JSON only:
{
  "matchScore": <number between 0 and 100>,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "summary": "<2-3 sentence summary of the candidate's fit>",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendation": "Shortlist" or "Review" or "Reject"
}
`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('YOUR_GEMINI_API_KEY')) {
      throw new Error('Gemini API key is not configured.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    console.log(`Sending resume analysis request to Gemini (${GEMINI_MODEL})...`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text().trim();
    console.log('Gemini analysis response received.');

    // Strip markdown code fences if the model still wraps the JSON
    let cleanedText = responseText;
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```\s*$/, '')
        .trim();
    }

    const parsedData = JSON.parse(cleanedText);

    // Enforce score/recommendation consistency
    let score = Number(parsedData.matchScore);
    if (isNaN(score) || score < 0) score = 30;
    if (score > 100) score = 100;

    let recommendation;
    if (score >= 70) recommendation = 'Shortlist';
    else if (score >= 50) recommendation = 'Review';
    else recommendation = 'Reject';

    return {
      matchScore: score,
      matchedSkills: Array.isArray(parsedData.matchedSkills) ? parsedData.matchedSkills : [],
      missingSkills: Array.isArray(parsedData.missingSkills) ? parsedData.missingSkills : [],
      summary: parsedData.summary || 'AI analysis summary not available.',
      strengths: Array.isArray(parsedData.strengths) ? parsedData.strengths : [],
      weaknesses: Array.isArray(parsedData.weaknesses) ? parsedData.weaknesses : [],
      recommendation,
    };
  } catch (error) {
    console.warn(
      'Gemini resume analysis failed. Running local keyword-based fallback...',
      error.message
    );
    return runLocalFallbackAnalysis(resumeText, jobDescription, skillsRequired);
  }
};

/**
 * Local resume analysis fallback using regex and keyword matching.
 * Used when the Gemini API is unavailable or the API key is not configured.
 */
function runLocalFallbackAnalysis(resumeText, jobDescription, skillsRequired) {
  const textLower = resumeText.toLowerCase();
  const jdLower = jobDescription.toLowerCase();

  // Build skills list from provided array or extract from job description
  let skillsToTest = [...skillsRequired];
  if (skillsToTest.length === 0) {
    const commonTech = [
      'react', 'node', 'express', 'mongodb', 'javascript', 'python', 'java',
      'sql', 'css', 'html', 'git', 'aws', 'docker', 'typescript', 'angular',
      'vue', 'graphql', 'rest', 'api', 'spring', 'django', 'flask',
    ];
    commonTech.forEach((skill) => {
      if (jdLower.includes(skill)) skillsToTest.push(skill);
    });
  }

  const matchedSkills = [];
  const missingSkills = [];

  skillsToTest.forEach((skill) => {
    const skillLower = skill.trim().toLowerCase();
    const regex = new RegExp(`\\b${escapeRegExp(skillLower)}\\b`, 'i');
    if (regex.test(textLower)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  // Base score: starts at 30 for having a parseable resume
  let baseScore = 30;

  if (skillsToTest.length > 0) {
    const skillRatio = matchedSkills.length / skillsToTest.length;
    baseScore += Math.round(skillRatio * 45); // up to 45 points for skills
  } else {
    baseScore += 20;
  }

  // Experience score
  const expMatch = textLower.match(/(\d+)\s*(years?|yrs?)\s*(of)?\s*(experience|exp|work)/i);
  let experienceYears = 0;
  if (expMatch) experienceYears = parseInt(expMatch[1]);

  if (experienceYears >= 5) baseScore += 20;
  else if (experienceYears >= 2) baseScore += 15;
  else if (experienceYears > 0) baseScore += 10;
  else {
    const roleCount = (textLower.match(/developer|engineer|manager|analyst|designer/g) || []).length;
    baseScore += Math.min(roleCount * 2, 8);
  }

  const matchScore = Math.min(Math.max(baseScore, 10), 100);

  let recommendation = 'Review';
  if (matchScore >= 70) recommendation = 'Shortlist';
  else if (matchScore < 50) recommendation = 'Reject';

  const strengths = [];
  const weaknesses = [];

  if (matchedSkills.length > 0) {
    strengths.push(
      `Demonstrated proficiency in required skills: ${matchedSkills.slice(0, 4).join(', ')}.`
    );
  }
  if (experienceYears > 0) {
    strengths.push(`Declares approximately ${experienceYears} years of industry experience.`);
  } else if (textLower.includes('intern') || textLower.includes('project')) {
    strengths.push('Shows practical exposure through internships or academic projects.');
  }

  if (missingSkills.length > 0) {
    weaknesses.push(
      `Lacks keyword presence for: ${missingSkills.slice(0, 4).join(', ')}.`
    );
  } else {
    weaknesses.push('Could show more quantified achievements in past roles.');
  }
  if (experienceYears === 0) {
    weaknesses.push('Limited senior-level commercial experience indicated in text.');
  }

  const summary = `Local Fallback Analysis: Match score ${matchScore}%. Candidate demonstrates familiarity with ${matchedSkills.length}/${skillsToTest.length || 'several'} required skills. Overall profile represents a ${recommendation === 'Shortlist' ? 'strong candidate' : recommendation === 'Review' ? 'candidate worth reviewing' : 'profile mismatch'} for this role.`;

  return { matchScore, matchedSkills, missingSkills, summary, strengths, weaknesses, recommendation };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
