const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");



router.get('/', async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM industries`);

    let industries = [];
    for (let i = 0; i < results.rows.length; i++) {
      let industryCode = results.rows[i]['code'];
      
      let compResult = await db.query(
        `SELECT i.code, i.industry, c.code
         FROM industries AS i
         LEFT JOIN companies_industries AS ci
         ON i.code = ci.industry_code
         LEFT JOIN companies AS c
         ON ci.company_code=c.code
         WHERE i.code= $1`,
        [industryCode]
      );
      let companies = compResult.rows;
      let industry = { code: industryCode,industry:results.rows[i]['industry'], companies: companies.map(com => com.code) };
      industries.push(industry);
    }

    return res.json({ industries: industries });
  } catch (e) {
    return next(e);
  }
});


router.post('/', async (req,res,next)=>{
    try{
        const {code, industry} = req.body;
        const results = await db.query(`INSERT INTO industries(code, industry) 
                                        VALUES ($1,$2) RETURNING code,industry`,[code, industry]);
        return res.status(201).json({industry: results.rows[0]});

    }catch(e){
        return next(e);
    }
})




module.exports = router;